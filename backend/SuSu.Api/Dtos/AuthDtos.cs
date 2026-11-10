using System.ComponentModel.DataAnnotations;

namespace SuSu.Api.Dtos;

// Lo que manda el frontend para registrarse
public record RegistroRequest(
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 100 caracteres.")]
    string Nombre,

    [Required(ErrorMessage = "El correo es obligatorio.")]
    [EmailAddress(ErrorMessage = "El correo no es válido.")]
    [StringLength(254)]
    string Correo,

    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    [StringLength(128, MinimumLength = 8, ErrorMessage = "La contraseña debe tener al menos 8 caracteres.")]
    string Contrasena,

    [StringLength(100)]
    string? Curso
);

// Lo que manda el frontend para iniciar sesión
public record LoginRequest(
    [Required(ErrorMessage = "El correo es obligatorio.")]
    [EmailAddress(ErrorMessage = "El correo no es válido.")]
    string Correo,

    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    string Contrasena
);

// Lo que la API devuelve: NUNCA incluye la contraseña ni el hash
public record UsuarioResponse(
    int IdUsuario,
    string Nombre,
    string Correo,
    string? Curso,
    DateTime FechaRegistro
);

// Lo que devuelve el login: el token + los datos del usuario
public record LoginResponse(
    string Token,
    DateTime Expira,
    UsuarioResponse Usuario
);