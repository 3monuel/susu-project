using System;
using System.Collections.Generic;

namespace SuSu.Api.Models;

public partial class SolicitudIa
{
    public int IdSolicitud { get; set; }

    public int IdUsuario { get; set; }

    public int? IdProyecto { get; set; }

    public string Descripcion { get; set; } = null!;

    public DateTime Fecha { get; set; }

    public string? TipoSolicitud { get; set; }

    public string? Estado { get; set; }

    public string? Respuesta { get; set; }

    public virtual Proyecto? IdProyectoNavigation { get; set; }

    public virtual Usuario IdUsuarioNavigation { get; set; } = null!;
}
