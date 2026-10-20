using System.Net.Http.Json;
using System.Text.Json;

public record ProyectoEntrada(string Nombre, string Descripcion, DateOnly FechaLimite);
public record TareaPropuesta(string Nombre, string Descripcion, DateOnly Fecha);
public record PropuestaProyecto(List<TareaPropuesta> Tareas);

public class AsistenteIAService
{
    private readonly HttpClient _http;
    private readonly string _modelo;
    private static readonly JsonSerializerOptions Opts = new() { PropertyNameCaseInsensitive = true };

    private const string PromptSistema = """
        Eres el asistente de SuSu, una app para estudiantes, incluyendo personas neurodivergentes.
        Tu trabajo es dividir proyectos en tareas pequeñas, claras y concretas.
        Reglas: una acción por tarea, lenguaje simple, nada de tareas vagas como "avanzar el proyecto".
        Las fechas deben ir entre hoy y la fecha límite, repartidas de forma realista.
        Responde con esta forma:
        {"tareas":[{"nombre":"...","descripcion":"...","fecha":"AAAA-MM-DD"}]}
        """;

    public AsistenteIAService(HttpClient http, IConfiguration config)
    {
        _http = http;
        _modelo = config["Gemini:Model"] ?? "gemini-3.7-flash";
    }

    public async Task<PropuestaProyecto> DividirProyectoAsync(ProyectoEntrada p)
    {
        var body = new
        {
            system_instruction = new { parts = new[] { new { text = PromptSistema } } },
            contents = new[]
            {
                new
                {
                    role = "user",
                    parts = new[]
                    {
                        new { text =
                            $"Proyecto: {p.Nombre}\nDescripción: {p.Descripcion}\n" +
                            $"Hoy: {DateOnly.FromDateTime(DateTime.Today):yyyy-MM-dd}\n" +
                            $"Fecha límite: {p.FechaLimite:yyyy-MM-dd}\nDivídelo en tareas." }
                    }
                }
            },
            generationConfig = new { responseMimeType = "application/json" }
        };

        var resp = await _http.PostAsJsonAsync($"v1beta/models/{_modelo}:generateContent", body);
        resp.EnsureSuccessStatusCode();

        var json = await resp.Content.ReadFromJsonAsync<JsonElement>();
        var texto = json.GetProperty("candidates")[0]
                        .GetProperty("content")
                        .GetProperty("parts")[0]
                        .GetProperty("text").GetString()!;

        return JsonSerializer.Deserialize<PropuestaProyecto>(texto, Opts)
               ?? throw new InvalidOperationException("La IA devolvió una respuesta inválida.");
    }
}