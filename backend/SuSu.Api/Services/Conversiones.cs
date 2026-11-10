using System.Globalization;

namespace SuSu.Api.Services;

// Traduce valores entre el frontend (minúsculas, fechas en texto)
// y la base de datos (restricciones CHECK en español, columnas DATE).
public static class Conversiones
{
    public static string PrioridadADb(string? valor) =>
        (valor ?? "media").Trim().ToLowerInvariant() switch
        {
            "baja" => "Baja",
            "alta" => "Alta",
            _ => "Media"
        };

    public static string PrioridadDesdeDb(string? valor) => valor switch
    {
        "Baja" => "baja",
        "Alta" => "alta",
        _ => "media"
    };

    // El frontend usa 2 estados y la base 3.
    // "pending" no borra el EnProgreso que haya puesto el Kanban.
    public static string EstadoADb(string? valor, string? estadoActual) =>
        (valor ?? "pending").Trim().ToLowerInvariant() switch
        {
            "completed" => "Terminada",
            _ => estadoActual == "EnProgreso" ? "EnProgreso" : "PorHacer"
        };

    public static string EstadoDesdeDb(string? valor) =>
        valor == "Terminada" ? "completed" : "pending";

    // Acepta "2026-11-20" o "2026-11-20T..." y toma solo la fecha
    public static DateOnly? FechaADb(string? valor)
    {
        if (string.IsNullOrWhiteSpace(valor) || valor.Trim().Length < 10)
            return null;

        return DateOnly.TryParseExact(valor.Trim()[..10], "yyyy-MM-dd",
            CultureInfo.InvariantCulture, DateTimeStyles.None, out var fecha)
            ? fecha
            : null;
    }

    public static string? FechaDesdeDb(DateOnly? fecha) =>
        fecha?.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);

    // Los ids viajan como texto; en la base son enteros
    public static int? IdDesdeTexto(string? valor) =>
        int.TryParse(valor, out var id) && id > 0 ? id : null;
}