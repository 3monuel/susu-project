using System.Globalization;
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
[Route("api")]
public class TasksController : ControllerBase
{
    private const string TareaNoEncontrada = "Tarea no encontrada.";
    private const string ProyectoNoEncontrado = "Proyecto no encontrado.";

    private readonly SusuDbContext _db;

    public TasksController(SusuDbContext db)
    {
        _db = db;
    }

    // El usuario siempre sale del token, nunca del cuerpo de la petición
    private int UsuarioId => User.GetUserId()
        ?? throw new UnauthorizedAccessException("Token sin usuario.");

    // GET api/tasks  (todas las tareas del usuario)
    [HttpGet("tasks")]
    public async Task<ActionResult<IEnumerable<TaskResponse>>> Listar()
    {
        var tareas = await TareasActivas()
            .OrderBy(t => t.Orden).ThenBy(t => t.FechaCreacion)
            .ToListAsync();

        return Ok(tareas.Select(ARespuesta));
    }

    // GET api/projects/{projectId}/tasks
    [HttpGet("projects/{projectId}/tasks")]
    public async Task<ActionResult<IEnumerable<TaskResponse>>> ListarDeProyecto(string projectId)
    {
        var idProyecto = await ProyectoPropio(projectId);
        if (idProyecto is null)
            return NotFound(new { message = ProyectoNoEncontrado });

        var tareas = await TareasActivas()
            .Where(t => t.IdProyecto == idProyecto)
            .OrderBy(t => t.Orden).ThenBy(t => t.FechaCreacion)
            .ToListAsync();

        return Ok(tareas.Select(ARespuesta));
    }

    // POST api/tasks  (tarea suelta; si el cuerpo trae projectId, se respeta)
    [HttpPost("tasks")]
    public Task<ActionResult<TaskResponse>> Crear(TaskRequest request) =>
        CrearEn(request.ProjectId, request);

    // POST api/projects/{projectId}/tasks
    [HttpPost("projects/{projectId}/tasks")]
    public Task<ActionResult<TaskResponse>> CrearEnProyecto(string projectId, TaskRequest request) =>
        CrearEn(projectId, request);

    // PUT api/tasks/{id}
    [HttpPut("tasks/{id}")]
    public async Task<ActionResult<TaskResponse>> Actualizar(string id, TaskRequest request)
    {
        var tarea = await TareaPropia(id);
        if (tarea is null)
            return NotFound(new { message = TareaNoEncontrada });

        int? idProyecto = null;
        if (!string.IsNullOrWhiteSpace(request.ProjectId))
        {
            idProyecto = await ProyectoPropio(request.ProjectId);
            if (idProyecto is null)
                return NotFound(new { message = ProyectoNoEncontrado });
        }
        tarea.IdProyecto = idProyecto;

        var error = await AplicarCambios(tarea, request);
        if (error is not null)
            return BadRequest(new { message = error });

        tarea.FechaActualizacion = DateTime.UtcNow; // el trigger también la actualiza
        await _db.SaveChangesAsync();

        return Ok(ARespuesta(tarea));
    }

    // DELETE api/tasks/{id}  (borrado lógico, incluye sus subtareas)
    [HttpDelete("tasks/{id}")]
    public async Task<IActionResult> Eliminar(string id)
    {
        var tarea = await TareaPropia(id);
        if (tarea is null)
            return NotFound(new { message = TareaNoEncontrada });

        // Junta la tarea y todas sus subtareas, en cualquier nivel
        var activas = await TareasActivas()
            .Select(t => new { t.IdTarea, t.IdTareaPadre })
            .ToListAsync();

        var aBorrar = new HashSet<int> { tarea.IdTarea };
        bool agregoAlguna;
        do
        {
            agregoAlguna = false;
            foreach (var t in activas)
            {
                if (t.IdTareaPadre is int padre && aBorrar.Contains(padre) && aBorrar.Add(t.IdTarea))
                    agregoAlguna = true;
            }
        } while (agregoAlguna);

        var ahora = DateTime.UtcNow;
        await TareasActivas()
            .Where(t => aBorrar.Contains(t.IdTarea))
            .ExecuteUpdateAsync(s => s.SetProperty(t => t.FechaEliminacion, ahora));

        return NoContent();
    }

    // ---------- Ayudantes ----------

    private IQueryable<Tarea> TareasActivas() =>
        _db.Tarea.Where(t => t.IdUsuario == UsuarioId && t.FechaEliminacion == null);

    private async Task<Tarea?> TareaPropia(string id)
    {
        var idTarea = Conversiones.IdDesdeTexto(id);
        if (idTarea is null)
            return null;

        return await TareasActivas().FirstOrDefaultAsync(t => t.IdTarea == idTarea);
    }

    // Devuelve el id solo si el proyecto es del usuario y no está borrado
    private async Task<int?> ProyectoPropio(string? id)
    {
        var idProyecto = Conversiones.IdDesdeTexto(id);
        if (idProyecto is null)
            return null;

        return await _db.Proyecto
            .Where(p => p.IdProyecto == idProyecto && p.IdUsuario == UsuarioId && p.FechaEliminacion == null)
            .Select(p => (int?)p.IdProyecto)
            .FirstOrDefaultAsync();
    }

    private async Task<ActionResult<TaskResponse>> CrearEn(string? projectId, TaskRequest request)
    {
        int? idProyecto = null;
        if (!string.IsNullOrWhiteSpace(projectId))
        {
            idProyecto = await ProyectoPropio(projectId);
            if (idProyecto is null)
                return NotFound(new { message = ProyectoNoEncontrado });
        }

        var ahora = DateTime.UtcNow;
        var tarea = new Tarea
        {
            IdUsuario = UsuarioId,
            IdProyecto = idProyecto,
            Estado = "PorHacer",
            FechaCreacion = ahora,
            FechaActualizacion = ahora
        };

        var error = await AplicarCambios(tarea, request);
        if (error is not null)
            return BadRequest(new { message = error });

        _db.Tarea.Add(tarea);
        await _db.SaveChangesAsync();

        return StatusCode(StatusCodes.Status201Created, ARespuesta(tarea));
    }

    // Copia los datos del request a la tarea. Devuelve un mensaje si algo no es válido.
    private async Task<string?> AplicarCambios(Tarea tarea, TaskRequest request)
    {
        DateTime? recordatorio = null;
        if (!string.IsNullOrWhiteSpace(request.ReminderAt))
        {
            if (!DateTimeOffset.TryParse(request.ReminderAt, CultureInfo.InvariantCulture,
                    DateTimeStyles.AssumeUniversal, out var fechaRecordatorio))
                return "La fecha del recordatorio no es válida.";

            recordatorio = fechaRecordatorio.UtcDateTime;
        }

        int? idPadre = null;
        if (!string.IsNullOrWhiteSpace(request.ParentTaskId))
        {
            idPadre = Conversiones.IdDesdeTexto(request.ParentTaskId);
            if (idPadre is null || idPadre == tarea.IdTarea)
                return "La tarea padre no es válida.";

            var padre = await TareasActivas().FirstOrDefaultAsync(t => t.IdTarea == idPadre);
            if (padre is null)
                return "La tarea padre no existe.";

            if (padre.IdProyecto != tarea.IdProyecto)
                return "La subtarea debe estar en el mismo proyecto que su tarea padre.";

            if (await CrearíaCiclo(tarea.IdTarea, padre))
                return "Una tarea no puede ser subtarea de sus propias subtareas.";
        }

        tarea.IdTareaPadre = idPadre;
        tarea.Nombre = request.Name.Trim();
        tarea.Descripcion = string.IsNullOrWhiteSpace(request.Description) ? null : request.Description.Trim();
        tarea.FechaLimite = Conversiones.FechaADb(request.DueDate);
        tarea.Prioridad = Conversiones.PrioridadADb(request.Priority);
        tarea.Estado = Conversiones.EstadoADb(request.State, tarea.Estado);
        tarea.Orden = request.Order ?? tarea.Orden;
        tarea.FechaRecordatorio = recordatorio;

        return null;
    }

    // Sube por la cadena de padres; si llega a la propia tarea, habría un ciclo
    private async Task<bool> CrearíaCiclo(int idTarea, Tarea padre)
    {
        if (idTarea == 0)
            return false; // tarea nueva: no puede haber ciclo

        int? actual = padre.IdTareaPadre;
        for (var i = 0; i < 100 && actual is not null; i++)
        {
            if (actual == idTarea)
                return true;

            var idBuscado = actual;
            actual = await _db.Tarea
                .Where(t => t.IdTarea == idBuscado)
                .Select(t => t.IdTareaPadre)
                .FirstOrDefaultAsync();
        }

        return false;
    }

    private static TaskResponse ARespuesta(Tarea t) => new(
        Id: t.IdTarea.ToString(),
        ProjectId: t.IdProyecto?.ToString(),
        ParentTaskId: t.IdTareaPadre?.ToString(),
        Name: t.Nombre,
        Description: t.Descripcion ?? "",
        DueDate: Conversiones.FechaDesdeDb(t.FechaLimite),
        Priority: Conversiones.PrioridadDesdeDb(t.Prioridad),
        State: Conversiones.EstadoDesdeDb(t.Estado),
        Order: t.Orden,
        ReminderAt: t.FechaRecordatorio,
        CreatedAt: t.FechaCreacion,
        UpdatedAt: t.FechaActualizacion,
        DeletedAt: t.FechaEliminacion
    );
}