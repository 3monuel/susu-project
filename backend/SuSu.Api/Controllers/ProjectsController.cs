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
[Route("api/projects")]
public class ProjectsController : ControllerBase
{
    private const string NoEncontrado = "Proyecto no encontrado.";

    private readonly SusuDbContext _db;

    public ProjectsController(SusuDbContext db)
    {
        _db = db;
    }

    // El usuario siempre sale del token, nunca del cuerpo de la petición
    private int UsuarioId => User.GetUserId()
        ?? throw new UnauthorizedAccessException("Token sin usuario.");

    // GET api/projects
    [HttpGet]
    public async Task<ActionResult<IEnumerable<ProjectResponse>>> Listar()
    {
        var proyectos = await _db.Proyecto
            .Where(p => p.IdUsuario == UsuarioId && p.FechaEliminacion == null)
            .OrderBy(p => p.FechaCreacion)
            .ToListAsync();

        return Ok(proyectos.Select(ARespuesta));
    }

    // GET api/projects/{id}
    [HttpGet("{id}")]
    public async Task<ActionResult<ProjectResponse>> Obtener(string id)
    {
        var proyecto = await BuscarPropio(id);
        if (proyecto is null)
            return NotFound(new { message = NoEncontrado });

        return Ok(ARespuesta(proyecto));
    }

    // POST api/projects
    [HttpPost]
    public async Task<ActionResult<ProjectResponse>> Crear(ProjectRequest request)
    {
        var ahora = DateTime.UtcNow;

        var proyecto = new Proyecto
        {
            IdUsuario = UsuarioId,
            FechaCreacion = ahora,
            FechaActualizacion = ahora
        };
        AplicarCambios(proyecto, request);

        _db.Proyecto.Add(proyecto);
        await _db.SaveChangesAsync();

        return StatusCode(StatusCodes.Status201Created, ARespuesta(proyecto));
    }

    // PUT api/projects/{id}
    [HttpPut("{id}")]
    public async Task<ActionResult<ProjectResponse>> Actualizar(string id, ProjectRequest request)
    {
        var proyecto = await BuscarPropio(id);
        if (proyecto is null)
            return NotFound(new { message = NoEncontrado });

        AplicarCambios(proyecto, request);
        proyecto.FechaActualizacion = DateTime.UtcNow; // el trigger también la actualiza

        await _db.SaveChangesAsync();
        return Ok(ARespuesta(proyecto));
    }

    // DELETE api/projects/{id}  (borrado lógico)
    [HttpDelete("{id}")]
    public async Task<IActionResult> Eliminar(string id)
    {
        var proyecto = await BuscarPropio(id);
        if (proyecto is null)
            return NotFound(new { message = NoEncontrado });

        var ahora = DateTime.UtcNow;

        await using var transaccion = await _db.Database.BeginTransactionAsync();

        // Igual que la base: las tareas se van con el proyecto
        // y las notas se quedan, pero sin proyecto
        await _db.Tarea
            .Where(t => t.IdProyecto == proyecto.IdProyecto && t.FechaEliminacion == null)
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.FechaEliminacion, ahora));

        await _db.Nota
            .Where(n => n.IdProyecto == proyecto.IdProyecto)
            .ExecuteUpdateAsync(s => s.SetProperty(n => n.IdProyecto, (int?)null));

        proyecto.FechaEliminacion = ahora;
        await _db.SaveChangesAsync();

        await transaccion.CommitAsync();
        return NoContent();
    }

    // Solo encuentra proyectos del usuario del token y que no estén borrados.
    // Si es de otro usuario, responde igual que si no existiera (404).
    private async Task<Proyecto?> BuscarPropio(string id)
    {
        var idProyecto = Conversiones.IdDesdeTexto(id);
        if (idProyecto is null)
            return null;

        return await _db.Proyecto.FirstOrDefaultAsync(p =>
            p.IdProyecto == idProyecto &&
            p.IdUsuario == UsuarioId &&
            p.FechaEliminacion == null);
    }

    private static void AplicarCambios(Proyecto proyecto, ProjectRequest request)
    {
        proyecto.Nombre = request.Name.Trim();
        proyecto.Descripcion = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        proyecto.FechaInicio = Conversiones.FechaADb(request.StartDate);
        proyecto.FechaLimite = Conversiones.FechaADb(request.DueDate);
        proyecto.Prioridad = Conversiones.PrioridadADb(request.Priority);
        proyecto.DificultadEstimada = Conversiones.PrioridadADb(request.Difficulty);
        proyecto.DuracionEstimada = request.EstimatedDurationMinutes;
    }

    private static ProjectResponse ARespuesta(Proyecto p) => new(
        Id: p.IdProyecto.ToString(),
        Slug: p.IdProyecto.ToString(),
        Name: p.Nombre,
        Description: p.Descripcion ?? "",
        StartDate: Conversiones.FechaDesdeDb(p.FechaInicio),
        DueDate: Conversiones.FechaDesdeDb(p.FechaLimite),
        Priority: Conversiones.PrioridadDesdeDb(p.Prioridad),
        Difficulty: Conversiones.PrioridadDesdeDb(p.DificultadEstimada),
        EstimatedDurationMinutes: p.DuracionEstimada,
        CreatedAt: p.FechaCreacion,
        UpdatedAt: p.FechaActualizacion,
        DeletedAt: p.FechaEliminacion
    );
}