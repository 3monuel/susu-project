using System;
using System.Collections.Generic;

namespace SuSu.Api.Models;

public partial class Usuario
{
    public int IdUsuario { get; set; }

    public string Nombre { get; set; } = null!;

    public string Correo { get; set; } = null!;

    public string ContrasenaHash { get; set; } = null!;

    public string EstadoCuenta { get; set; } = null!;

    public string? Curso { get; set; }

    public DateTime FechaRegistro { get; set; }

    public virtual Ajustes? Ajustes { get; set; }

    public virtual ICollection<CodigoVerificacion> CodigoVerificacion { get; set; } = new List<CodigoVerificacion>();

    public virtual ICollection<Nota> Nota { get; set; } = new List<Nota>();

    public virtual ICollection<Proyecto> Proyecto { get; set; } = new List<Proyecto>();

    public virtual ICollection<ReporteError> ReporteError { get; set; } = new List<ReporteError>();

    public virtual ICollection<SolicitudIa> SolicitudIa { get; set; } = new List<SolicitudIa>();

    public virtual ICollection<Tarea> Tarea { get; set; } = new List<Tarea>();
}
