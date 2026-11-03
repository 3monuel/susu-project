using System;
using System.Collections.Generic;

namespace SuSu.Api.Models;

public partial class Ajustes
{
    public int IdUsuario { get; set; }

    public string TamanoInterfaz { get; set; } = null!;

    public string Tema { get; set; } = null!;

    public string OrdenProyectos { get; set; } = null!;

    public bool MostrarCompletadas { get; set; }

    public bool SinAnimaciones { get; set; }

    public virtual Usuario IdUsuarioNavigation { get; set; } = null!;
}
