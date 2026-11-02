using System;
using System.Collections.Generic;

namespace SuSu.Api.Models;

public partial class CodigoVerificacion
{
    public int IdCodigo { get; set; }

    public int IdUsuario { get; set; }

    public string CodigoHash { get; set; } = null!;

    public DateTime FechaCreacion { get; set; }

    public DateTime FechaExpiracion { get; set; }

    public bool Usado { get; set; }

    public virtual Usuario IdUsuarioNavigation { get; set; } = null!;
}
