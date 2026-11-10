using System.ComponentModel.DataAnnotations;

namespace SuSu.Api.Dtos;

// POST /api/auth/register
public record RegisterRequest(
    [Required(ErrorMessage = "El nombre es obligatorio.")]
    [StringLength(100, MinimumLength = 2, ErrorMessage = "El nombre debe tener entre 2 y 100 caracteres.")]
    string Name,

    [Required(ErrorMessage = "El correo es obligatorio.")]
    [EmailAddress(ErrorMessage = "El correo no es válido.")]
    [StringLength(254)]
    string Email,

    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    [StringLength(128, MinimumLength = 8, ErrorMessage = "La contraseña debe tener al menos 8 caracteres.")]
    string Password
);

// POST /api/auth/login
public record LoginRequest(
    [Required(ErrorMessage = "El correo es obligatorio.")]
    [EmailAddress(ErrorMessage = "El correo no es válido.")]
    string Email,

    [Required(ErrorMessage = "La contraseña es obligatoria.")]
    string Password
);

// "user" del contrato: { id, name, email }. Nunca incluye contraseña ni hash.
// El id va como texto porque el frontend maneja los ids como string.
public record UserResponse(string Id, string Name, string Email);

// Respuesta de login y register: { token, user }
public record AuthResponse(string Token, UserResponse User);