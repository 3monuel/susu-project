using System;
using System.Collections.Generic;

namespace SuSu.Api.Models;

public partial class Proyecto
{
    public int IdProyecto { get; set; }

    public int IdUsuario { get; set; }

    public string Nombre { get; set; } = null!;

    public string? Descripcion { get; set; }

    public DateOnly? FechaInicio { get; set; }

    public DateOnly? FechaLimite { get; set; }

    public string Prioridad { get; set; } = null!;

    public string? DificultadEstimada { get; set; }

    public int? DuracionEstimada { get; set; }

    public DateTime FechaCreacion { get; set; }

    public DateTime FechaActualizacion { get; set; }

    public DateTime? FechaEliminacion { get; set; }

    public virtual Usuario IdUsuarioNavigation { get; set; } = null!;

    public virtual ICollection<Nota> Nota { get; set; } = new List<Nota>();

    public virtual ICollection<SolicitudIa> SolicitudIa { get; set; } = new List<SolicitudIa>();

    public virtual ICollection<Tarea> TareaIdProyectoNavigation { get; set; } = new List<Tarea>();

    public virtual ICollection<Tarea> TareaProyecto { get; set; } = new List<Tarea>();
}
