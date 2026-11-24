using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using SuSu.Api.Data;
using SuSu.Api.Models;
using SuSu.Api.Services;

var builder = WebApplication.CreateBuilder(args);

// Controladores. Los errores de validación salen como { "message": "..." },
// que es lo que lee el frontend.
builder.Services.AddControllers()
    .ConfigureApiBehaviorOptions(options =>
    {
        options.InvalidModelStateResponseFactory = context =>
        {
            var mensaje = context.ModelState.Values
                .SelectMany(v => v.Errors)
                .Select(e => string.IsNullOrWhiteSpace(e.ErrorMessage) ? "Datos inválidos." : e.ErrorMessage)
                .FirstOrDefault() ?? "Datos inválidos.";

            return new BadRequestObjectResult(new { message = mensaje });
        };
    });

// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// CORS: permite que el frontend (Vite, puerto 5173) llame a la API
const string CorsFrontend = "Frontend";
var origenesPermitidos = builder.Configuration.GetSection("Cors:Origins").Get<string[]>()
                         ?? new[] { "http://localhost:5173" };

builder.Services.AddCors(options =>
    options.AddPolicy(CorsFrontend, policy => policy
        .WithOrigins(origenesPermitidos)
        .AllowAnyHeader()
        .AllowAnyMethod()));

// Conexión a PostgreSQL (la cadena viene de user-secrets, nunca del repo)
builder.Services.AddDbContext<SusuDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("SusuDb")));

// Hash de contraseñas para registro e inicio de sesión
builder.Services.AddSingleton<IPasswordHasher<Usuario>, PasswordHasher<Usuario>>();

// Tokens JWT (la clave Jwt:Key viene de user-secrets)
builder.Services.AddSingleton<TokenService>();

builder.Services
    .AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.MapInboundClaims = false; // conserva "sub" tal cual
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidIssuer = TokenService.Issuer,
            ValidateAudience = true,
            ValidAudience = TokenService.Audience,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = TokenService.CrearLlave(builder.Configuration),
            ClockSkew = TimeSpan.FromMinutes(1)
        };
    });

builder.Services.AddAuthorization();

builder.Services.AddHttpClient<AsistenteIAService>(client =>
{
    client.BaseAddress = new Uri("https://generativelanguage.googleapis.com/");
    client.DefaultRequestHeaders.Add("x-goog-api-key", builder.Configuration["Gemini:ApiKey"]);
});

var app = builder.Build();

// Cualquier error no controlado sale como { "message": "..." }, sin detalles internos.
// El detalle completo sigue apareciendo en la consola del backend.
app.UseExceptionHandler(errorApp => errorApp.Run(async context =>
{
    context.Response.StatusCode = StatusCodes.Status500InternalServerError;
    await context.Response.WriteAsJsonAsync(new { message = "Ocurrió un error en el servidor." });
}));

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseCors(CorsFrontend);  // antes de la autenticación
app.UseAuthentication();    // ¿quién eres?
app.UseAuthorization();     // ¿tienes permiso?

app.MapControllers();

app.Run();