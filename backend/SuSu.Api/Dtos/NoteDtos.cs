using System.ComponentModel.DataAnnotations;

namespace SuSu.Api.Dtos;

// Lo que manda el frontend en POST y PUT
public record NoteRequest(
    [StringLength(200, ErrorMessage = "El título no puede pasar de 200 caracteres.")]
    string? Title,

    [StringLength(20000, ErrorMessage = "El contenido es demasiado largo.")]
    string? Content,

    string? ProjectId
);

// La forma exacta de Note en el frontend
public record NoteResponse(
    string Id,
    string? ProjectId,
    string Title,
    string Content,
    DateTime CreatedAt,
    DateTime UpdatedAt,
    DateTime? DeletedAt
);