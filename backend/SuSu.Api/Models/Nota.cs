using System;
using System.Collections.Generic;

namespace SuSu.Api.Models;

public partial class Nota
{
    public int IdNota { get; set; }

    public int IdUsuario { get; set; }

    public int? IdProyecto { get; set; }

    public string Titulo { get; set; } = null!;

    public string? Descripcion { get; set; }

    public DateTime FechaCreacion { get; set; }

    public DateTime FechaActualizacion { get; set; }

    public DateTime? FechaEliminacion { get; set; }

    public virtual Proyecto? IdProyectoNavigation { get; set; }

    public virtual Usuario IdUsuarioNavigation { get; set; } = null!;
}
