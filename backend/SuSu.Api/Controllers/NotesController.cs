using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SuSu.Api.Data;
using SuSu.Api.Dtos;
using SuSu.Api.Models;
using SuSu.Api.Services;

namespace SuSu.Api.Controllers;

[ApiController]
[Authorize]
[Route("api/notes")]
public class NotesController : ControllerBase
{
    private const string NotaNoEncontrada = "Nota no encontrada.";
    private const string ProyectoNoEncontrado = "Proyecto no encontrado.";

    private readonly SusuDbContext _db;

    public NotesController(SusuDbContext db)
    {
        _db = db;
    }

    // El usuario siempre sale del token, nunca del cuerpo de la petición
    private int UsuarioId => User.GetUserId()
        ?? throw new UnauthorizedAccessException("Token sin usuario.");

    // GET api/notes
    [HttpGet]
    public async Task<ActionResult<IEnumerable<NoteResponse>>> Listar()
    {
        var notas = await NotasActivas()
            .OrderByDescending(n => n.FechaActualizacion)
            .ToListAsync();

        return Ok(notas.Select(ARespuesta));
    }

    // GET api/notes/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<NoteResponse>> Obtener(string id)
    {
        var nota = await NotaPropia(id);
        if (nota is null)
            return NotFound(new { message = NotaNoEncontrada });

        return Ok(ARespuesta(nota));
    }

    // POST api/notes
    [HttpPost]
    public async Task<ActionResult<NoteResponse>> Crear(NoteRequest request)
    {
        var (idProyecto, proyectoValido) = await ValidarProyecto(request.ProjectId);
        if (!proyectoValido)
            return NotFound(new { message = ProyectoNoEncontrado });

        var ahora = DateTime.UtcNow;
        var nota = new Nota
        {
            IdUsuario = UsuarioId,
            IdProyecto = idProyecto,
            Titulo = (request.Title ?? "").Trim(),
            Descripcion = request.Content ?? "",
            FechaCreacion = ahora,
            FechaActualizacion = ahora
        };

        _db.Nota.Add(nota);
        await _db.SaveChangesAsync();

        return StatusCode(StatusCodes.Status201Created, ARespuesta(nota));
    }

    // PUT api/notes/{id}
    [HttpPut("{id}")]
    public async Task<ActionResult<NoteResponse>> Actualizar(string id, NoteRequest request)
    {
        var nota = await NotaPropia(id);
        if (nota is null)
            return NotFound(new { message = NotaNoEncontrada });

        var (idProyecto, proyectoValido) = await ValidarProyecto(request.ProjectId);
        if (!proyectoValido)
            return NotFound(new { message = ProyectoNoEncontrado });

        nota.IdProyecto = idProyecto;
        nota.Titulo = (request.Title ?? "").Trim();
        nota.Descripcion = request.Content ?? "";
        nota.FechaActualizacion = DateTime.UtcNow; // el trigger también la actualiza

        await _db.SaveChangesAsync();
        return Ok(ARespuesta(nota));
    }

    // DELETE api/notes/{id}  (borrado lógico)
    [HttpDelete("{id}")]
    public async Task<IActionResult> Eliminar(string id)
    {
        var nota = await NotaPropia(id);
        if (nota is null)
            return NotFound(new { message = NotaNoEncontrada });

        nota.FechaEliminacion = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return NoContent();
    }

    // ---------- Ayudantes ----------

    private IQueryable<Nota> NotasActivas() =>
        _db.Nota.Where(n => n.IdUsuario == UsuarioId && n.FechaEliminacion == null);

    private async Task<Nota?> NotaPropia(string id)
    {
        var idNota = Conversiones.IdDesdeTexto(id);
        if (idNota is null)
            return null;

        return await NotasActivas().FirstOrDefaultAsync(n => n.IdNota == idNota);
    }

    // Sin projectId: válido y sin proyecto. Con projectId: debe ser un proyecto propio y activo.
    private async Task<(int? IdProyecto, bool Valido)> ValidarProyecto(string? projectId)
    {
        if (string.IsNullOrWhiteSpace(projectId))
            return (null, true);

        var idProyecto = Conversiones.IdDesdeTexto(projectId);
        if (idProyecto is null)
            return (null, false);

        var existe = await _db.Proyecto.AnyAsync(p =>
            p.IdProyecto == idProyecto &&
            p.IdUsuario == UsuarioId &&
            p.FechaEliminacion == null);

        return existe ? (idProyecto, true) : (null, false);
    }

    private static NoteResponse ARespuesta(Nota n) => new(
        Id: n.IdNota.ToString(),
        ProjectId: n.IdProyecto?.ToString(),
        Title: n.Titulo,
        Content: n.Descripcion ?? "",
        CreatedAt: n.FechaCreacion,
        UpdatedAt: n.FechaActualizacion,
        DeletedAt: n.FechaEliminacion
    );
}