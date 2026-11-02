using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using SuSu.Api.Data;

namespace SuSu.Api.Controllers;

[ApiController]
[Route("api/[controller]")]
public class SaludController : ControllerBase
{
    private readonly SusuDbContext _db;

    public SaludController(SusuDbContext db)
    {
        _db = db;
    }

    // GET api/salud/db
    [HttpGet("db")]
    public async Task<IActionResult> ProbarBaseDeDatos()
    {
        var conecta = await _db.Database.CanConnectAsync();
        if (!conecta)
            return StatusCode(503, new { conectado = false });

        return Ok(new
        {
            conectado = true,
            usuarios = await _db.Usuario.CountAsync(),
            proyectos = await _db.Proyecto.CountAsync()
        });
    }
}