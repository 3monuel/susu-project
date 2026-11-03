using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SuSu.Api.Data;
using SuSu.Api.Dtos;
using SuSu.Api.Models;

namespace SuSu.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class AuthController : ControllerBase
{
    private const string MensajeLoginInvalido = "Correo o contraseña incorrectos.";

    private readonly SusuDbContext _db;
    private readonly IPasswordHasher<Usuario> _hasher;

    public AuthController(SusuDbContext db, IPasswordHasher<Usuario> hasher)
    {
        _db = db;
        _hasher = hasher;
    }

    // POST api/auth/registro
    [HttpPost("registro")]
    public async Task<ActionResult<UsuarioResponse>> Registro(RegistroRequest request)
    {
        var correo = NormalizarCorreo(request.Correo);

        if (await _db.Usuario.AnyAsync(u => u.Correo == correo))
            return Conflict(new { mensaje = "Ese correo ya está registrado." });

        var usuario = new Usuario
        {
            Nombre = request.Nombre.Trim(),
            Correo = correo,
            Curso = string.IsNullOrWhiteSpace(request.Curso) ? null : request.Curso.Trim(),
            EstadoCuenta = "activa",
            FechaRegistro = DateTime.UtcNow
        };

        // Se guarda solo el hash, nunca la contraseña original
        usuario.ContrasenaHash = _hasher.HashPassword(usuario, request.Contrasena);

        _db.Usuario.Add(usuario);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException)        catch (DbUpdateException ex) when (ex.InnerException is Npgsql.PostgresException { SqlState: "23505" })
        {
            // Por si dos personas registran el mismo correo al mismo tiempo
            return Conflict(new { mensaje = "Ese correo ya está registrado." });
        }

        return StatusCode(StatusCodes.Status201Created, ARespuesta(usuario));
    }

    // POST api/auth/login
    [HttpPost("login")]
    public async Task<ActionResult<UsuarioResponse>> Login(LoginRequest request)
    {
        var correo = NormalizarCorreo(request.Correo);
        var usuario = await _db.Usuario.FirstOrDefaultAsync(u => u.Correo == correo);

        // Mismo mensaje si no existe el correo o si la contraseña está mal,
        // para no revelar qué correos están registrados
        if (usuario is null)
            return Unauthorized(new { mensaje = MensajeLoginInvalido });

        var resultado = _hasher.VerifyHashedPassword(usuario, usuario.ContrasenaHash, request.Contrasena);

        if (resultado == PasswordVerificationResult.Failed)
            return Unauthorized(new { mensaje = MensajeLoginInvalido });

        if (usuario.EstadoCuenta != "activa")
            return StatusCode(StatusCodes.Status403Forbidden, new { mensaje = "La cuenta está desactivada." });

        // Si el algoritmo de hash se actualiza en el futuro, se re-cifra al entrar
        if (resultado == PasswordVerificationResult.SuccessRehashNeeded)
        {
            usuario.ContrasenaHash = _hasher.HashPassword(usuario, request.Contrasena);
            await _db.SaveChangesAsync();
        }

        return Ok(ARespuesta(usuario));
    }

    private static string NormalizarCorreo(string correo) => correo.Trim().ToLowerInvariant();

    private static UsuarioResponse ARespuesta(Usuario u) =>
        new(u.IdUsuario, u.Nombre, u.Correo, u.Curso, u.FechaRegistro);
}