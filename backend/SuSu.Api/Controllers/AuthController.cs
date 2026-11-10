using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SuSu.Api.Data;
using SuSu.Api.Dtos;
using SuSu.Api.Models;
using SuSu.Api.Services;

namespace SuSu.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private const string MensajeLoginInvalido = "Correo o contraseña incorrectos.";

    private readonly SusuDbContext _db;
    private readonly IPasswordHasher<Usuario> _hasher;
    private readonly TokenService _tokens;

    public AuthController(SusuDbContext db, IPasswordHasher<Usuario> hasher, TokenService tokens)
    {
        _db = db;
        _hasher = hasher;
        _tokens = tokens;
    }

    // POST api/auth/register
    [HttpPost("register")]
    public async Task<ActionResult<AuthResponse>> Register(RegisterRequest request)
    {
        var correo = NormalizarCorreo(request.Email);

        if (await _db.Usuario.AnyAsync(u => u.Correo == correo))
            return Conflict(new { message = "Ese correo ya está registrado." });

        var usuario = new Usuario
        {
            Nombre = request.Name.Trim(),
            Correo = correo,
            EstadoCuenta = "activa",
            FechaRegistro = DateTime.UtcNow
        };

        // Se guarda solo el hash, nunca la contraseña original
        usuario.ContrasenaHash = _hasher.HashPassword(usuario, request.Password);

        _db.Usuario.Add(usuario);

        try
        {
            await _db.SaveChangesAsync();
        }
        catch (DbUpdateException ex) when (ex.InnerException is Npgsql.PostgresException { SqlState: "23505" })
        {
            // Por si dos personas registran el mismo correo al mismo tiempo
            return Conflict(new { message = "Ese correo ya está registrado." });
        }

        return StatusCode(StatusCodes.Status201Created, CrearRespuesta(usuario));
    }

    // POST api/auth/login
    [HttpPost("login")]
    public async Task<ActionResult<AuthResponse>> Login(LoginRequest request)
    {
        var correo = NormalizarCorreo(request.Email);
        var usuario = await _db.Usuario.FirstOrDefaultAsync(u => u.Correo == correo);

        // Mismo mensaje si no existe el correo o si la contraseña está mal
        if (usuario is null)
            return Unauthorized(new { message = MensajeLoginInvalido });

        var resultado = _hasher.VerifyHashedPassword(usuario, usuario.ContrasenaHash, request.Password);

        if (resultado == PasswordVerificationResult.Failed)
            return Unauthorized(new { message = MensajeLoginInvalido });

        if (usuario.EstadoCuenta != "activa")
            return StatusCode(StatusCodes.Status403Forbidden, new { message = "La cuenta está desactivada." });

        if (resultado == PasswordVerificationResult.SuccessRehashNeeded)
        {
            usuario.ContrasenaHash = _hasher.HashPassword(usuario, request.Password);
            await _db.SaveChangesAsync();
        }

        return Ok(CrearRespuesta(usuario));
    }

    // POST api/auth/logout
    // El token no se guarda en el servidor, así que basta con que el cliente lo borre.
    [HttpPost("logout")]
    public IActionResult Logout() => NoContent();

    // GET api/auth/me  (solo con token válido)
    [Authorize]
    [HttpGet("me")]
    public async Task<ActionResult<UserResponse>> Me()
    {
        var idUsuario = User.GetUserId();
        if (idUsuario is null)
            return Unauthorized(new { message = "Sesión no válida." });

        var usuario = await _db.Usuario.FindAsync(idUsuario.Value);
        if (usuario is null || usuario.EstadoCuenta != "activa")
            return Unauthorized(new { message = "Sesión no válida." });

        return Ok(AUsuario(usuario));
    }

    private AuthResponse CrearRespuesta(Usuario usuario)
    {
        var (token, _) = _tokens.Crear(usuario);
        return new AuthResponse(token, AUsuario(usuario));
    }

    private static string NormalizarCorreo(string correo) => correo.Trim().ToLowerInvariant();

    private static UserResponse AUsuario(Usuario u) =>
        new(u.IdUsuario.ToString(), u.Nombre, u.Correo);
}