using System.ComponentModel.DataAnnotations;

namespace SuSu.Api.Dtos;

// POST /api/assistant/plan  →  { projectId, request }
public record AssistantPlanRequest(
    [Required(ErrorMessage = "Selecciona un proyecto.")]
    string ProjectId,

    [Required(ErrorMessage = "Escribe qué necesitas del asistente.")]
    [StringLength(12000, MinimumLength = 1, ErrorMessage = "La solicitud es demasiado larga.")]
    string Request
);

// Cada elemento de SuggestedTask[] del contrato: { name, description, dueDate, priority }
public record SuggestedTaskResponse(string Name, string Description, string? DueDate, string Priority);
