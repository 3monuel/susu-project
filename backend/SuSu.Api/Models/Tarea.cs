using System;
using System.Collections.Generic;

namespace SuSu.Api.Models;

public partial class Tarea
{
    public int IdTarea { get; set; }

    public int IdProyecto { get; set; }

    public int? IdTareaPadre { get; set; }

    public string Nombre { get; set; } = null!;

    public string? Descripcion { get; set; }

    public string? Dificultad { get; set; }

    public string Estado { get; set; } = null!;

    public int Orden { get; set; }

    public DateOnly? FechaLimite { get; set; }

    public virtual Proyecto IdProyectoNavigation { get; set; } = null!;

    public virtual Tarea? IdTareaPadreNavigation { get; set; }

    public virtual ICollection<Tarea> InverseIdTareaPadreNavigation { get; set; } = new List<Tarea>();
}
