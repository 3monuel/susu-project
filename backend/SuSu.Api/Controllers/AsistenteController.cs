using System.Globalization;
using System.Text.Json;
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
[Route("api/assistant")]
public class AsistenteController : ControllerBase
{
    private const int MaxTareas = 12;

    private readonly SusuDbContext _db;
    private readonly AsistenteIAService _ia;
    private readonly ILogger<AsistenteController> _logger;

    public AsistenteController(SusuDbContext db, AsistenteIAService ia, ILogger<AsistenteController> logger)
    {
        _db = db;
        _ia = ia;
        _logger = logger;
    }

    // El usuario siempre sale del token, nunca del cuerpo de la petición
    private int UsuarioId => User.GetUserId()
        ?? throw new UnauthorizedAccessException("Token sin usuario.");

    // POST api/assistant/plan
    // Devuelve tareas sugeridas. No guarda ninguna tarea: el frontend las crea solo si el usuario confirma.
    [HttpPost("plan")]
    public async Task<ActionResult<IEnumerable<SuggestedTaskResponse>>> Planificar(
        AssistantPlanRequest request, CancellationToken cancelacion)
    {
        if (!_ia.EstaConfigurado)
            return StatusCode(503, new { message = "El asistente de IA todavía no está configurado en el servidor." });

        var idProyecto = Conversiones.IdDesdeTexto(request.ProjectId);
        var proyecto = idProyecto is null
            ? null
            : await _db.Proyecto.FirstOrDefaultAsync(p =>
                p.IdProyecto == idProyecto &&
                p.IdUsuario == UsuarioId &&
                p.FechaEliminacion == null, cancelacion);
        if (proyecto is null)
            return NotFound(new { message = "Proyecto no encontrado." });

        var tareasExistentes = await _db.Tarea
            .Where(t => t.IdProyecto == proyecto.IdProyecto && t.FechaEliminacion == null)
            .OrderBy(t => t.Orden)
            .Select(t => t.Nombre)
            .Take(50)
            .ToListAsync(cancelacion);

        var hoy = HoyEnMexico();
        var contexto = new ContextoPlan(
            Proyecto: proyecto.Nombre,
            Descripcion: proyecto.Descripcion,
            FechaInicio: proyecto.FechaInicio,
            FechaLimite: proyecto.FechaLimite,
            Prioridad: Conversiones.PrioridadDesdeDb(proyecto.Prioridad),
            Dificultad: proyecto.DificultadEstimada is null ? null : Conversiones.PrioridadDesdeDb(proyecto.DificultadEstimada),
            DuracionMinutos: proyecto.DuracionEstimada,
            TareasExistentes: tareasExistentes,
            Solicitud: request.Request.Trim(),
            Hoy: hoy);

        // Historial de solicitudes (tabla solicitud_ia)
        var solicitud = new SolicitudIa
        {
            IdUsuario = UsuarioId,
            IdProyecto = proyecto.IdProyecto,
            Descripcion = Recortar(request.Request.Trim(), 4000),
            Fecha = DateTime.UtcNow,
            TipoSolicitud = "planificacion",
        };

        try
        {
            var propuestas = await _ia.ProponerTareasAsync(contexto, cancelacion);
            var tareas = Normalizar(propuestas, hoy, proyecto.FechaLimite);

            if (tareas.Count == 0)
            {
                await GuardarHistorialAsync(solicitud, "error", "La IA no propuso tareas válidas.");
                return StatusCode(502, new { message = "La IA no propuso tareas. Intenta describir mejor lo que necesitas." });
            }

            await GuardarHistorialAsync(solicitud, "completada", JsonSerializer.Serialize(tareas));
            return Ok(tareas);
        }
        catch (AsistenteNoDisponibleException ex)
        {
            _logger.LogError(ex, "El asistente de IA no pudo generar la propuesta.");
            await GuardarHistorialAsync(solicitud, "error", ex.Message);
            return StatusCode(503, new { message = ex.Message });
        }
    }

    // Revisa lo que propuso la IA: nombres útiles, prioridades válidas y fechas dentro del proyecto.
    private static List<SuggestedTaskResponse> Normalizar(
        IReadOnlyList<TareaPropuestaIa> propuestas, DateOnly hoy, DateOnly? fechaLimite)
    {
        var resultado = new List<SuggestedTaskResponse>();
        var nombres = new HashSet<string>(StringComparer.OrdinalIgnoreCase);

        foreach (var propuesta in propuestas)
        {
            var nombre = Recortar(propuesta.Nombre?.Trim() ?? "", 200);
            if (nombre.Length == 0 || !nombres.Add(nombre))
                continue;

            var prioridad = (propuesta.Prioridad ?? "").Trim().ToLowerInvariant() switch
            {
                "baja" => "baja",
                "alta" => "alta",
                _ => "media",
            };

            string? fecha = null;
            if (DateOnly.TryParseExact(propuesta.Fecha?.Trim(), "yyyy-MM-dd",
                    CultureInfo.InvariantCulture, DateTimeStyles.None, out var dia))
            {
                if (dia < hoy) dia = hoy;
                if (fechaLimite is DateOnly limite && dia > limite) dia = limite < hoy ? hoy : limite;
                fecha = dia.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
            }

            resultado.Add(new SuggestedTaskResponse(
                nombre,
                Recortar(propuesta.Descripcion?.Trim() ?? "", 1000),
                fecha,
                prioridad));

            if (resultado.Count == MaxTareas)
                break;
        }

        return resultado;
    }

    // Si no se puede guardar el historial, la propuesta igual se entrega al usuario.
    private async Task GuardarHistorialAsync(SolicitudIa solicitud, string estado, string respuesta)
    {
        solicitud.Estado = estado;
        solicitud.Respuesta = respuesta;
        try
        {
            _db.SolicitudIa.Add(solicitud);
            await _db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "No se pudo guardar el historial de la solicitud de IA.");
        }
    }

    private static DateOnly HoyEnMexico()
    {
        try
        {
            var zona = TimeZoneInfo.FindSystemTimeZoneById("America/Mexico_City");
            return DateOnly.FromDateTime(TimeZoneInfo.ConvertTimeFromUtc(DateTime.UtcNow, zona));
        }
        catch (Exception)
        {
            return DateOnly.FromDateTime(DateTime.UtcNow.AddHours(-6));
        }
    }

    private static string Recortar(string texto, int maximo) =>
        texto.Length <= maximo ? texto : texto[..maximo];
}
