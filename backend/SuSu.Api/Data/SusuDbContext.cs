using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;
using SuSu.Api.Models;

namespace SuSu.Api.Data;

public partial class SusuDbContext : DbContext
{
    public SusuDbContext(DbContextOptions<SusuDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<Ajustes> Ajustes { get; set; }

    public virtual DbSet<CodigoVerificacion> CodigoVerificacion { get; set; }

    public virtual DbSet<Nota> Nota { get; set; }

    public virtual DbSet<Proyecto> Proyecto { get; set; }

    public virtual DbSet<ReporteError> ReporteError { get; set; }

    public virtual DbSet<SolicitudIa> SolicitudIa { get; set; }

    public virtual DbSet<Tarea> Tarea { get; set; }

    public virtual DbSet<Usuario> Usuario { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Ajustes>(entity =>
        {
            entity.HasKey(e => e.IdUsuario).HasName("ajustes_pkey");

            entity.ToTable("ajustes");

            entity.Property(e => e.IdUsuario)
                .ValueGeneratedNever()
                .HasColumnName("id_usuario");
            entity.Property(e => e.MostrarCompletadas)
                .HasDefaultValue(true)
                .HasColumnName("mostrar_completadas");
            entity.Property(e => e.OrdenProyectos)
                .HasDefaultValueSql("'automatico'::text")
                .HasColumnName("orden_proyectos");
            entity.Property(e => e.SinAnimaciones).HasColumnName("sin_animaciones");
            entity.Property(e => e.TamanoInterfaz)
                .HasDefaultValueSql("'mediano'::text")
                .HasColumnName("tamano_interfaz");
            entity.Property(e => e.Tema)
                .HasDefaultValueSql("'claro'::text")
                .HasColumnName("tema");

            entity.HasOne(d => d.IdUsuarioNavigation).WithOne(p => p.Ajustes)
                .HasForeignKey<Ajustes>(d => d.IdUsuario)
                .HasConstraintName("ajustes_id_usuario_fkey");
        });

        modelBuilder.Entity<CodigoVerificacion>(entity =>
        {
            entity.HasKey(e => e.IdCodigo).HasName("codigo_verificacion_pkey");

            entity.ToTable("codigo_verificacion");

            entity.Property(e => e.IdCodigo)
                .UseIdentityAlwaysColumn()
                .HasColumnName("id_codigo");
            entity.Property(e => e.CodigoHash).HasColumnName("codigo_hash");
            entity.Property(e => e.FechaCreacion)
                .HasDefaultValueSql("now()")
                .HasColumnName("fecha_creacion");
            entity.Property(e => e.FechaExpiracion).HasColumnName("fecha_expiracion");
            entity.Property(e => e.IdUsuario).HasColumnName("id_usuario");
            entity.Property(e => e.Usado).HasColumnName("usado");

            entity.HasOne(d => d.IdUsuarioNavigation).WithMany(p => p.CodigoVerificacion)
                .HasForeignKey(d => d.IdUsuario)
                .HasConstraintName("codigo_verificacion_id_usuario_fkey");
        });

        modelBuilder.Entity<Nota>(entity =>
        {
            entity.HasKey(e => e.IdNota).HasName("nota_pkey");

            entity.ToTable("nota");

            entity.HasIndex(e => e.IdUsuario, "ix_nota_usuario");

            entity.Property(e => e.IdNota)
                .UseIdentityAlwaysColumn()
                .HasColumnName("id_nota");
            entity.Property(e => e.Descripcion).HasColumnName("descripcion");
            entity.Property(e => e.FechaCreacion)
                .HasDefaultValueSql("now()")
                .HasColumnName("fecha_creacion");
            entity.Property(e => e.IdProyecto).HasColumnName("id_proyecto");
            entity.Property(e => e.IdUsuario).HasColumnName("id_usuario");
            entity.Property(e => e.Titulo).HasColumnName("titulo");

            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.Nota)
                .HasForeignKey(d => d.IdProyecto)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("nota_id_proyecto_fkey");

            entity.HasOne(d => d.IdUsuarioNavigation).WithMany(p => p.Nota)
                .HasForeignKey(d => d.IdUsuario)
                .HasConstraintName("nota_id_usuario_fkey");
        });

        modelBuilder.Entity<Proyecto>(entity =>
        {
            entity.HasKey(e => e.IdProyecto).HasName("proyecto_pkey");

            entity.ToTable("proyecto");

            entity.HasIndex(e => e.IdUsuario, "ix_proyecto_usuario");

            entity.Property(e => e.IdProyecto)
                .UseIdentityAlwaysColumn()
                .HasColumnName("id_proyecto");
            entity.Property(e => e.Descripcion).HasColumnName("descripcion");
            entity.Property(e => e.DificultadEstimada).HasColumnName("dificultad_estimada");
            entity.Property(e => e.DuracionEstimada).HasColumnName("duracion_estimada");
            entity.Property(e => e.FechaInicio).HasColumnName("fecha_inicio");
            entity.Property(e => e.FechaLimite).HasColumnName("fecha_limite");
            entity.Property(e => e.IdUsuario).HasColumnName("id_usuario");
            entity.Property(e => e.Nombre).HasColumnName("nombre");
            entity.Property(e => e.Prioridad)
                .HasDefaultValueSql("'Media'::text")
                .HasColumnName("prioridad");

            entity.HasOne(d => d.IdUsuarioNavigation).WithMany(p => p.Proyecto)
                .HasForeignKey(d => d.IdUsuario)
                .HasConstraintName("proyecto_id_usuario_fkey");
        });

        modelBuilder.Entity<ReporteError>(entity =>
        {
            entity.HasKey(e => e.IdReporte).HasName("reporte_error_pkey");

            entity.ToTable("reporte_error");

            entity.Property(e => e.IdReporte)
                .UseIdentityAlwaysColumn()
                .HasColumnName("id_reporte");
            entity.Property(e => e.ApartadoAfectado).HasColumnName("apartado_afectado");
            entity.Property(e => e.Descripcion).HasColumnName("descripcion");
            entity.Property(e => e.Fecha)
                .HasDefaultValueSql("now()")
                .HasColumnName("fecha");
            entity.Property(e => e.IdUsuario).HasColumnName("id_usuario");
            entity.Property(e => e.TipoProblema).HasColumnName("tipo_problema");

            entity.HasOne(d => d.IdUsuarioNavigation).WithMany(p => p.ReporteError)
                .HasForeignKey(d => d.IdUsuario)
                .HasConstraintName("reporte_error_id_usuario_fkey");
        });

        modelBuilder.Entity<SolicitudIa>(entity =>
        {
            entity.HasKey(e => e.IdSolicitud).HasName("solicitud_ia_pkey");

            entity.ToTable("solicitud_ia");

            entity.Property(e => e.IdSolicitud)
                .UseIdentityAlwaysColumn()
                .HasColumnName("id_solicitud");
            entity.Property(e => e.Descripcion).HasColumnName("descripcion");
            entity.Property(e => e.Estado).HasColumnName("estado");
            entity.Property(e => e.Fecha)
                .HasDefaultValueSql("now()")
                .HasColumnName("fecha");
            entity.Property(e => e.IdProyecto).HasColumnName("id_proyecto");
            entity.Property(e => e.IdUsuario).HasColumnName("id_usuario");
            entity.Property(e => e.Respuesta).HasColumnName("respuesta");
            entity.Property(e => e.TipoSolicitud).HasColumnName("tipo_solicitud");

            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.SolicitudIa)
                .HasForeignKey(d => d.IdProyecto)
                .OnDelete(DeleteBehavior.SetNull)
                .HasConstraintName("solicitud_ia_id_proyecto_fkey");

            entity.HasOne(d => d.IdUsuarioNavigation).WithMany(p => p.SolicitudIa)
                .HasForeignKey(d => d.IdUsuario)
                .HasConstraintName("solicitud_ia_id_usuario_fkey");
        });

        modelBuilder.Entity<Tarea>(entity =>
        {
            entity.HasKey(e => e.IdTarea).HasName("tarea_pkey");

            entity.ToTable("tarea");

            entity.HasIndex(e => e.FechaLimite, "ix_tarea_fecha");

            entity.HasIndex(e => e.IdProyecto, "ix_tarea_proyecto");

            entity.Property(e => e.IdTarea)
                .UseIdentityAlwaysColumn()
                .HasColumnName("id_tarea");
            entity.Property(e => e.Descripcion).HasColumnName("descripcion");
            entity.Property(e => e.Dificultad).HasColumnName("dificultad");
            entity.Property(e => e.Estado)
                .HasDefaultValueSql("'PorHacer'::text")
                .HasColumnName("estado");
            entity.Property(e => e.FechaLimite).HasColumnName("fecha_limite");
            entity.Property(e => e.IdProyecto).HasColumnName("id_proyecto");
            entity.Property(e => e.IdTareaPadre).HasColumnName("id_tarea_padre");
            entity.Property(e => e.Nombre).HasColumnName("nombre");
            entity.Property(e => e.Orden).HasColumnName("orden");

            entity.HasOne(d => d.IdProyectoNavigation).WithMany(p => p.Tarea)
                .HasForeignKey(d => d.IdProyecto)
                .HasConstraintName("tarea_id_proyecto_fkey");

            entity.HasOne(d => d.IdTareaPadreNavigation).WithMany(p => p.InverseIdTareaPadreNavigation)
                .HasForeignKey(d => d.IdTareaPadre)
                .OnDelete(DeleteBehavior.Cascade)
                .HasConstraintName("tarea_id_tarea_padre_fkey");
        });

        modelBuilder.Entity<Usuario>(entity =>
        {
            entity.HasKey(e => e.IdUsuario).HasName("usuario_pkey");

            entity.ToTable("usuario");

            entity.HasIndex(e => e.Correo, "usuario_correo_key").IsUnique();

            entity.Property(e => e.IdUsuario)
                .UseIdentityAlwaysColumn()
                .HasColumnName("id_usuario");
            entity.Property(e => e.ContrasenaHash).HasColumnName("contrasena_hash");
            entity.Property(e => e.Correo).HasColumnName("correo");
            entity.Property(e => e.Curso).HasColumnName("curso");
            entity.Property(e => e.EstadoCuenta)
                .HasDefaultValueSql("'activa'::text")
                .HasColumnName("estado_cuenta");
            entity.Property(e => e.FechaRegistro)
                .HasDefaultValueSql("now()")
                .HasColumnName("fecha_registro");
            entity.Property(e => e.Nombre).HasColumnName("nombre");
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
