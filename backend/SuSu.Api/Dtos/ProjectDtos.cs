using System.ComponentModel.DataAnnotations;

namespace SuSu.Api.Dtos;

// Lo que manda el frontend en POST y PUT.
// Los campos extra (id, slug, createdAt, tone...) se ignoran:
// el servidor decide esos valores.
public record ProjectRequest(
    [Required(ErrorMessage = "El nombre del proyecto es obligatorio.")]
    [StringLength(150, MinimumLength = 1, ErrorMessage = "El nombre debe tener entre 1 y 150 caracteres.")]
    string Name,

    [StringLength(2000, ErrorMessage = "La descripción no puede pasar de 2000 caracteres.")]
    string? Description,

    [RegularExpression(@"^\d{4}-\d{2}-\d{2}.*$", ErrorMessage = "La fecha de inicio debe tener formato AAAA-MM-DD.")]
    string? StartDate,

    [RegularExpression(@"^\d{4}-\d{2}-\d{2}.*$", ErrorMessage = "La fecha límite debe tener formato AAAA-MM-DD.")]
    string? DueDate,

    [RegularExpression("^(baja|media|alta)$", ErrorMessage = "La prioridad debe ser baja, media o alta.")]
    string? Priority,

    [RegularExpression("^(baja|media|alta)$", ErrorMessage = "La dificultad debe ser baja, media o alta.")]
    string? Difficulty,

    [Range(0, int.MaxValue, ErrorMessage = "La duración estimada no puede ser negativa.")]
    int? EstimatedDurationMinutes
);

// Lo que la API devuelve: la forma exacta de Project en el frontend
public record ProjectResponse(
    string Id,
    string Slug,
    string Name,
    string Description,
    string? StartDate,
    string? DueDate,
    string Priority,
    string Difficulty,
    int? EstimatedDurationMinutes,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    DateTime? DeletedAt
);