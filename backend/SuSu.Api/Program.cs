using Microsoft.EntityFrameworkCore;
using SuSu.Api.Data;

var builder = WebApplication.CreateBuilder(args);

// Add services to the container.

builder.Services.AddControllers();
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();

// Conexión a PostgreSQL (la cadena viene de user-secrets, nunca del repo)
builder.Services.AddDbContext<SusuDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("SusuDb")));

builder.Services.AddHttpClient<AsistenteIAService>(client =>
{
    client.BaseAddress = new Uri("https://generativelanguage.googleapis.com/");
    client.DefaultRequestHeaders.Add("x-goog-api-key", builder.Configuration["Gemini:ApiKey"]);
});

var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseHttpsRedirection();

app.UseAuthorization();

app.MapControllers();

app.Run();