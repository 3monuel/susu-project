using System;
using System.Collections.Generic;

namespace SuSu.Api.Models;

public partial class ReporteError
{
    public int IdReporte { get; set; }

    public int IdUsuario { get; set; }

    public string TipoProblema { get; set; } = null!;

    public string? ApartadoAfectado { get; set; }

    public string Descripcion { get; set; } = null!;

    public DateTime Fecha { get; set; }

    public virtual Usuario IdUsuarioNavigation { get; set; } = null!;
}
