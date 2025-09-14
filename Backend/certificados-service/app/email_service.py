# app/email_service.py
import os
import re
import json
import base64
import requests
import time
from typing import List, Dict, Optional, Tuple
from datetime import datetime
from io import BytesIO
from sqlalchemy.orm import Session
from reportlab.lib.pagesizes import A4, landscape
from reportlab.platypus import SimpleDocTemplate, Image as ReportLabImage
from reportlab.lib.units import inch
from reportlab.pdfgen import canvas
from PIL import Image

from app.models import LogEmail, EstadoEmail, PlantillaEmail, Plantilla, Usuario
from app.schemas import EnvioEmailIndividual, LogEmailResponse

# Configuración SMTP2GO
SMTP2GO_API_KEY = os.getenv("SMTP2GO_API_KEY")
SMTP2GO_API_URL = "https://api.smtp2go.com/v3/email/send"
SENDER_EMAIL = os.getenv("SMTP2GO_SENDER_EMAIL", "Centro de Desarrollo Profesional CDP <documentos@capacitacionescdp.com>")
LOTE_SIZE = int(os.getenv("SMTP2GO_LOTE_SIZE", "10"))
PAUSA_LOTES = int(os.getenv("SMTP2GO_PAUSA_LOTES", "20"))

class EmailService:
    def __init__(self, db: Session):
        self.db = db
        
    def procesar_variables(self, contenido: str, variables: Dict[str, str]) -> str:
        """
        Procesa las variables en el contenido HTML
        Reemplaza {VARIABLE} con el valor correspondiente
        """
        contenido_procesado = contenido
        
        for variable, valor in variables.items():
            patron = f"{{{variable.upper()}}}"
            contenido_procesado = contenido_procesado.replace(patron, str(valor))
        
        return contenido_procesado
    
    def extraer_variables_plantilla(self, contenido_html: str) -> List[str]:
        """
        Extrae todas las variables {VARIABLE} del contenido HTML
        """
        patron = r'\{([A-Z_]+)\}'
        variables = re.findall(patron, contenido_html)
        return list(set(variables))  # Eliminar duplicados
    
    def generar_pdf_certificado(self, plantilla: Plantilla, variables: Dict[str, str]) -> bytes:
        """
        Genera un PDF del certificado usando la plantilla y variables
        """
        try:
            # Crear PDF en memoria
            buffer = BytesIO()
            
            # Tamaño del PDF (A4 horizontal por defecto)
            pdf_width, pdf_height = landscape(A4)
            
            # Crear documento
            doc = SimpleDocTemplate(buffer, pagesize=landscape(A4))
            story = []
            
            # Si hay imagen de fondo, agregarla
            if plantilla.background_image_url:
                try:
                    # Descargar imagen de fondo
                    response = requests.get(plantilla.background_image_url, timeout=10)
                    if response.status_code == 200:
                        img_buffer = BytesIO(response.content)
                        
                        # Crear canvas para manejo manual
                        c = canvas.Canvas(buffer, pagesize=landscape(A4))
                        
                        # Agregar imagen de fondo
                        c.drawImage(img_buffer, 0, 0, width=pdf_width, height=pdf_height)
                        
                        # Procesar campos de la plantilla
                        if plantilla.fields_json:
                            fields = json.loads(plantilla.fields_json)
                            canvas_config = json.loads(plantilla.canvas_json) if plantilla.canvas_json else {"width": 1600, "height": 1131}
                            
                            # Escalas para convertir coordenadas del canvas al PDF
                            scale_x = pdf_width / canvas_config.get("width", 1600)
                            scale_y = pdf_height / canvas_config.get("height", 1131)
                            
                            for field in fields:
                                if field.get("type") == "text":
                                    self._agregar_texto_pdf(c, field, variables, scale_x, scale_y, pdf_height)
                        
                        c.save()
                        buffer.seek(0)
                        return buffer.getvalue()
                        
                except Exception as e:
                    print(f"Error procesando imagen de fondo: {e}")
            
            # Si no hay imagen de fondo o falló, crear PDF básico
            c = canvas.Canvas(buffer, pagesize=landscape(A4))
            c.setFont("Helvetica-Bold", 24)
            c.drawCentredText(pdf_width/2, pdf_height/2, f"Certificado para {variables.get('NOMBRE', '')} {variables.get('APELLIDO', '')}")
            c.save()
            
            buffer.seek(0)
            return buffer.getvalue()
            
        except Exception as e:
            print(f"Error generando PDF: {e}")
            # PDF de emergencia
            buffer = BytesIO()
            c = canvas.Canvas(buffer, pagesize=landscape(A4))
            c.setFont("Helvetica", 16)
            c.drawCentredText(landscape(A4)[0]/2, landscape(A4)[1]/2, "Certificado CDP")
            c.save()
            buffer.seek(0)
            return buffer.getvalue()
    
    def _agregar_texto_pdf(self, canvas_obj, field: Dict, variables: Dict[str, str], 
                          scale_x: float, scale_y: float, pdf_height: float):
        """
        Agrega texto al PDF basado en la configuración del campo
        """
        try:
            # Procesar el texto con variables
            texto = self.procesar_variables(field.get("text", ""), variables)
            
            # Coordenadas escaladas (invertir Y para PDF)
            x = field.get("x", 0) * scale_x
            y = pdf_height - (field.get("y", 0) * scale_y)
            
            # Configurar fuente
            font_size = field.get("fontSize", 12) * min(scale_x, scale_y)
            font_family = field.get("fontFamily", "Helvetica")
            font_style = field.get("fontStyle", "normal")
            
            # Mapear fuentes
            if font_family.lower() in ["times", "times new roman"]:
                font_name = "Times-Roman" if font_style != "bold" else "Times-Bold"
            elif font_family.lower() == "courier":
                font_name = "Courier" if font_style != "bold" else "Courier-Bold"
            else:
                font_name = "Helvetica" if font_style != "bold" else "Helvetica-Bold"
            
            canvas_obj.setFont(font_name, font_size)
            
            # Color del texto
            fill_color = field.get("fill", "#000000")
            if fill_color.startswith("#"):
                # Convertir hex a RGB
                r = int(fill_color[1:3], 16) / 255
                g = int(fill_color[3:5], 16) / 255
                b = int(fill_color[5:7], 16) / 255
                canvas_obj.setFillColorRGB(r, g, b)
            
            # Alineación
            align = field.get("align", "left")
            if align == "center":
                canvas_obj.drawCentredText(x, y, texto)
            elif align == "right":
                canvas_obj.drawRightString(x, y, texto)
            else:
                canvas_obj.drawString(x, y, texto)
                
        except Exception as e:
            print(f"Error agregando texto al PDF: {e}")
    
    def enviar_email_smtp2go(self, destinatario: str, asunto: str, contenido_html: str, 
                           adjunto_pdf: Optional[bytes] = None, nombre_adjunto: str = "certificado.pdf") -> Tuple[bool, str]:
        """
        Envía email usando SMTP2GO
        """
        if not SMTP2GO_API_KEY:
            return False, "SMTP2GO_API_KEY no configurado"
        
        try:
            payload = {
                "api_key": SMTP2GO_API_KEY,
                "sender": SENDER_EMAIL,
                "to": [destinatario],
                "subject": asunto,
                "html_body": contenido_html
            }
            
            # Agregar adjunto si existe
            if adjunto_pdf:
                pdf_base64 = base64.b64encode(adjunto_pdf).decode('utf-8')
                payload["attachments"] = [{
                    "filename": nombre_adjunto,
                    "fileblob": pdf_base64,
                    "mimetype": "application/pdf"
                }]
            
            response = requests.post(
                SMTP2GO_API_URL,
                json=payload,
                headers={"Content-Type": "application/json"},
                timeout=30
            )
            
            if response.status_code == 200:
                data = response.json().get('data', {})
                if data.get('succeeded', 0) > 0:
                    return True, "Email enviado exitosamente"
                else:
                    error = data.get('failures', ['Error desconocido'])[0] if data.get('failures') else "Error API"
                    return False, f"Falló el envío: {error}"
            else:
                return False, f"HTTP {response.status_code}: {response.text}"
                
        except Exception as e:
            return False, f"Error de conexión: {str(e)}"
    
    def enviar_email_individual(self, envio_data: EnvioEmailIndividual) -> LogEmailResponse:
        """
        Envía un email individual y registra el log
        """
        # Crear log inicial
        log_email = LogEmail(
            destinatario_email=envio_data.destinatario_email,
            destinatario_nombre=envio_data.destinatario_nombre,
            asunto=envio_data.asunto,
            plantilla_certificado_id=envio_data.plantilla_certificado_id,
            estado=EstadoEmail.PENDIENTE
        )
        
        try:
            # Procesar contenido con variables
            contenido_procesado = envio_data.contenido_html
            if envio_data.variables:
                contenido_procesado = self.procesar_variables(contenido_procesado, envio_data.variables)
            
            # Generar PDF si hay plantilla de certificado
            adjunto_pdf = None
            if envio_data.plantilla_certificado_id:
                plantilla = self.db.query(Plantilla).filter(
                    Plantilla.id == envio_data.plantilla_certificado_id
                ).first()
                
                if plantilla:
                    variables_pdf = envio_data.variables or {}
                    adjunto_pdf = self.generar_pdf_certificado(plantilla, variables_pdf)
            
            # Enviar email
            exito, mensaje = self.enviar_email_smtp2go(
                destinatario=envio_data.destinatario_email,
                asunto=envio_data.asunto,
                contenido_html=contenido_procesado,
                adjunto_pdf=adjunto_pdf
            )
            
            # Actualizar log
            if exito:
                log_email.estado = EstadoEmail.ENVIADO
                log_email.fecha_entrega = datetime.utcnow()
            else:
                log_email.estado = EstadoEmail.ERROR
                log_email.mensaje_error = mensaje
            
            # Guardar metadatos
            metadatos = {
                "variables_utilizadas": list(envio_data.variables.keys()) if envio_data.variables else [],
                "tiene_adjunto": adjunto_pdf is not None,
                "timestamp_envio": datetime.utcnow().isoformat()
            }
            log_email.metadatos = json.dumps(metadatos)
            
        except Exception as e:
            log_email.estado = EstadoEmail.ERROR
            log_email.mensaje_error = f"Error interno: {str(e)}"
        
        # Guardar log en base de datos
        self.db.add(log_email)
        self.db.commit()
        self.db.refresh(log_email)
        
        return LogEmailResponse.from_orm(log_email)
    
    def enviar_email_masivo_lotes(self, plantilla_email_id: str, destinatarios_ids: List[str], 
                                 plantilla_certificado_id: Optional[str] = None,
                                 variables_globales: Optional[Dict] = None,
                                 configuracion_lotes: Optional[Dict] = None) -> Dict:
        """
        Envía emails masivos por lotes con configuración de pausas
        """
        import time
        from datetime import datetime
        
        # Configuración de lotes
        lote_size = LOTE_SIZE
        pausa_lotes = PAUSA_LOTES
        pausa_individual = 1.0
        
        if configuracion_lotes:
            lote_size = configuracion_lotes.get("lote_size", lote_size)
            pausa_lotes = configuracion_lotes.get("pausa_lotes", pausa_lotes)
            pausa_individual = configuracion_lotes.get("pausa_individual", pausa_individual)
        
        # Obtener plantilla de email
        plantilla_email = self.db.query(PlantillaEmail).filter(
            PlantillaEmail.id == plantilla_email_id,
            PlantillaEmail.is_active == True
        ).first()
        
        if not plantilla_email:
            raise ValueError("Plantilla de email no encontrada")
        
        # Obtener destinatarios
        usuarios = self.db.query(Usuario).filter(
            Usuario.id.in_(destinatarios_ids),
            Usuario.is_active == True
        ).all()
        
        if not usuarios:
            raise ValueError("No se encontraron usuarios válidos")
        
        resultados = {
            "total_destinatarios": len(usuarios),
            "enviados_exitosos": 0,
            "errores": 0,
            "log_ids": [],
            "errores_detalle": [],
            "tiempo_total": 0
        }
        
        # Dividir en lotes
        lotes = [usuarios[i:i + lote_size] for i in range(0, len(usuarios), lote_size)]
        tiempo_inicio = time.time()
        
        print(f"🚀 Iniciando envío masivo: {len(usuarios)} destinatarios en {len(lotes)} lotes")
        
        # Procesar cada lote
        for num_lote, lote in enumerate(lotes, 1):
            print(f"📦 Procesando lote {num_lote}/{len(lotes)} ({len(lote)} correos)")
            
            for num_correo, usuario in enumerate(lote, 1):
                try:
                    print(f"  📧 {num_correo}/{len(lote)}: {usuario.email}")
                    
                    # Preparar variables personalizadas
                    variables = {
                        "NOMBRE": usuario.nombre,
                        "APELLIDO": usuario.apellido,
                        "NOMBRE_COMPLETO": usuario.nombre_completo,
                        "EMAIL": usuario.email,
                        "CEDULA": usuario.cedula
                    }
                    
                    # Agregar variables globales
                    if variables_globales:
                        variables.update(variables_globales)
                    
                    # Procesar asunto y contenido
                    asunto_procesado = self.procesar_variables(plantilla_email.asunto, variables)
                    contenido_procesado = self.procesar_variables(plantilla_email.contenido_html, variables)
                    
                    # Crear datos de envío
                    envio_data = EnvioEmailIndividual(
                        destinatario_email=usuario.email,
                        destinatario_nombre=usuario.nombre_completo,
                        asunto=asunto_procesado,
                        contenido_html=contenido_procesado,
                        plantilla_certificado_id=plantilla_certificado_id,
                        variables=variables
                    )
                    
                    # Enviar email
                    log_result = self.enviar_email_individual(envio_data)
                    resultados["log_ids"].append(log_result.id)
                    
                    if log_result.estado == EstadoEmail.ENVIADO:
                        resultados["enviados_exitosos"] += 1
                        print(f"     ✅ ENVIADO")
                    else:
                        resultados["errores"] += 1
                        error_msg = f"{usuario.email}: {log_result.mensaje_error}"
                        resultados["errores_detalle"].append(error_msg)
                        print(f"     ❌ FALLÓ: {log_result.mensaje_error}")
                    
                    # Pausa entre correos individuales
                    if pausa_individual > 0:
                        time.sleep(pausa_individual)
                    
                except Exception as e:
                    resultados["errores"] += 1
                    error_msg = f"{usuario.email}: {str(e)}"
                    resultados["errores_detalle"].append(error_msg)
                    print(f"     ❌ ERROR: {str(e)}")
            
            # Pausa entre lotes (excepto el último)
            if num_lote < len(lotes) and pausa_lotes > 0:
                print(f"⏳ Pausa entre lotes: {pausa_lotes}s...")
                time.sleep(pausa_lotes)
        
        # Calcular tiempo total
        tiempo_total = time.time() - tiempo_inicio
        resultados["tiempo_total"] = round(tiempo_total, 2)
        
        print(f"\n🏁 ENVÍO COMPLETADO")
        print(f"✅ Exitosos: {resultados['enviados_exitosos']}")
        print(f"❌ Fallidos: {resultados['errores']}")
        print(f"⏱️ Tiempo: {tiempo_total:.1f}s")
        
        return resultados
    
    def obtener_estadisticas_email(self) -> Dict:
        """
        Obtiene estadísticas de envíos de email
        """
        from sqlalchemy import func
        
        # Estadísticas generales
        total_enviados = self.db.query(LogEmail).count()
        total_entregados = self.db.query(LogEmail).filter(LogEmail.estado == EstadoEmail.ENVIADO).count()
        total_errores = self.db.query(LogEmail).filter(LogEmail.estado == EstadoEmail.ERROR).count()
        total_pendientes = self.db.query(LogEmail).filter(LogEmail.estado == EstadoEmail.PENDIENTE).count()
        
        # Estadísticas por tiempo
        hoy = datetime.now().date()
        emails_hoy = self.db.query(LogEmail).filter(func.date(LogEmail.fecha_envio) == hoy).count()
        
        return {
            "total_enviados": total_enviados,
            "total_entregados": total_entregados,
            "total_errores": total_errores,
            "total_pendientes": total_pendientes,
            "emails_hoy": emails_hoy,
            "tasa_exito": round((total_entregados / total_enviados * 100), 2) if total_enviados > 0 else 0
        }