using System.ComponentModel.DataAnnotations;

namespace SuSu.Api.Dtos;

// Lo que manda el frontend en POST y PUT.
// id, createdAt, updatedAt y deletedAt los decide el servidor.
public record TaskRequest(
    [Required(ErrorMessage = "El nombre de la tarea es obligatorio.")]
    [StringLength(200, MinimumLength = 1, ErrorMessage = "El nombre debe tener entre 1 y 200 caracteres.")]
    string Name,

    [StringLength(2000, ErrorMessage = "La descripción no puede pasar de 2000 caracteres.")]
    string? Description,

    string? ProjectId,

    string? ParentTaskId,

    [RegularExpression(@"^\d{4}-\d{2}-\d{2}.*$", ErrorMessage = "La fecha límite debe tener formato AAAA-MM-DD.")]
    string? DueDate,

    [RegularExpression("^(baja|media|alta)$", ErrorMessage = "La prioridad debe ser baja, media o alta.")]
    string? Priority,

    [RegularExpression("^(pending|completed)$", ErrorMessage = "El estado debe ser pending o completed.")]
    string? State,

    [Range(0, int.MaxValue, ErrorMessage = "El orden no puede ser negativo.")]
    int? Order,

    string? ReminderAt
);

// La forma exacta de Task en el frontend
public record TaskResponse(
    string Id,
    string? ProjectId,
    string? ParentTaskId,
    string Name,
    string Description,
    string? DueDate,
    string Priority,
    string State,
    int Order,
    DateTime? ReminderAt,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    DateTime? DeletedAt
);