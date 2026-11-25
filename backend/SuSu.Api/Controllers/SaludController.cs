using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SuSu.Api.Data;

namespace SuSu.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SaludController : ControllerBase
{
    private readonly SusuDbContext _db;
    private readonly ILogger<SaludController> _logger;

    public SaludController(SusuDbContext db, ILogger<SaludController> logger)
    {
        _db = db;
        _logger = logger;
    }

    // GET api/salud
    // Solo confirma que la API está encendida. La usa el hosting para saber si el servicio vive.
    [HttpGet]
    public IActionResult Estado() => Ok(new { estado = "ok" });

    // GET api/salud/db
    [HttpGet("db")]
    public async Task<IActionResult> ProbarBaseDeDatos()
    {
        try
        {
            // Abrir la conexión directamente (en lugar de CanConnectAsync) deja ver el motivo real si falla.
            await _db.Database.OpenConnectionAsync();
            await _db.Database.CloseConnectionAsync();
        }
        catch (Exception ex)
        {
            // El detalle va solo a los logs del servidor; la respuesta no expone información interna.
            _logger.LogError(ex, "No se pudo conectar a la base de datos.");
            return StatusCode(503, new { conectado = false, message = "No se pudo conectar a la base de datos." });
        }

        return Ok(new
        {
            conectado = true,
            usuarios = await _db.Usuario.CountAsync(),
            proyectos = await _db.Proyecto.CountAsync()
        });
    }
}
