import logging
from typing import List, Optional
from app.config import settings
from app.models.emergency_contact import EmergencyContact
from app.models.alert import Alert, AlertType

logger = logging.getLogger(__name__)


class NotificationService:
    """Service for sending SMS and email notifications to emergency contacts"""
    
    def __init__(self):
        self.sms_enabled = settings.ENABLE_SMS_NOTIFICATIONS and settings.TWILIO_ACCOUNT_SID
        self.email_enabled = settings.ENABLE_EMAIL_NOTIFICATIONS and settings.SENDGRID_API_KEY
        
        if self.sms_enabled:
            try:
                from twilio.rest import Client
                self.twilio_client = Client(
                    settings.TWILIO_ACCOUNT_SID,
                    settings.TWILIO_AUTH_TOKEN
                )
                logger.info("SMS notifications enabled via Twilio")
            except Exception as e:
                logger.warning(f"Failed to initialize Twilio client: {e}")
                self.sms_enabled = False
        
        if self.email_enabled:
            try:
                import sendgrid
                from sendgrid.helpers.mail import Mail
                self.sendgrid_client = sendgrid.SendGridAPIClient(settings.SENDGRID_API_KEY)
                self.Mail = Mail
                logger.info("Email notifications enabled via SendGrid")
            except Exception as e:
                logger.warning(f"Failed to initialize SendGrid client: {e}")
                self.email_enabled = False
    
    def format_alert_message(self, alert: Alert, location_info: Optional[str] = None) -> str:
        """Format alert message for notifications"""
        alert_type_name = alert.alert_type.replace('_', ' ').title()
        message = f"🚨 EMERGENCY ALERT: {alert.child_name}\n"
        message += f"Type: {alert_type_name}\n"
        message += f"Time: {alert.timestamp.strftime('%Y-%m-%d %H:%M:%S')}\n"
        
        if alert.message:
            message += f"Details: {alert.message}\n"
        
        if location_info:
            message += f"Location: {location_info}\n"
        
        message += "\nPlease respond immediately!"
        return message
    
    def send_sms(self, phone_number: str, message: str) -> bool:
        """Send SMS notification via Twilio"""
        if not self.sms_enabled:
            logger.debug("SMS notifications disabled, skipping")
            return False
        
        try:
            self.twilio_client.messages.create(
                body=message,
                from_=settings.TWILIO_PHONE_NUMBER,
                to=phone_number
            )
            logger.info(f"SMS sent successfully to {phone_number}")
            return True
        except Exception as e:
            logger.error(f"Failed to send SMS to {phone_number}: {e}")
            return False
    
    def send_email(self, email: str, subject: str, message: str) -> bool:
        """Send email notification via SendGrid"""
        if not self.email_enabled:
            logger.debug("Email notifications disabled, skipping")
            return False
        
        try:
            mail = self.Mail(
                from_email=settings.SENDGRID_FROM_EMAIL,
                to_emails=email,
                subject=subject,
                plain_text_content=message
            )
            response = self.sendgrid_client.send(mail)
            logger.info(f"Email sent successfully to {email}, status: {response.status_code}")
            return True
        except Exception as e:
            logger.error(f"Failed to send email to {email}: {e}")
            return False
    
    def send_alert_notifications(
        self,
        alert: Alert,
        contacts: List[EmergencyContact],
        location_info: Optional[str] = None
    ) -> dict:
        """
        Send notifications to all emergency contacts for an alert.
        Returns dict with delivery status for each contact.
        """
        if not contacts:
            logger.warning("No emergency contacts to notify")
            return {}
        
        message = self.format_alert_message(alert, location_info)
        subject = f"🚨 Emergency Alert: {alert.child_name}"
        
        results = {}
        
        # Sort contacts by priority (lower number = higher priority)
        sorted_contacts = sorted(contacts, key=lambda c: c.priority)
        
        for contact in sorted_contacts:
            contact_results = {
                'sms_sent': False,
                'email_sent': False,
                'sms_error': None,
                'email_error': None
            }
            
            # Send SMS if phone number available
            if contact.phone_number:
                contact_results['sms_sent'] = self.send_sms(contact.phone_number, message)
                if not contact_results['sms_sent']:
                    contact_results['sms_error'] = "SMS delivery failed"
            
            # Send email if email address available
            if contact.email:
                contact_results['email_sent'] = self.send_email(contact.email, subject, message)
                if not contact_results['email_sent']:
                    contact_results['email_error'] = "Email delivery failed"
            
            results[str(contact.contact_id)] = contact_results
        
        # Log summary
        sms_count = sum(1 for r in results.values() if r['sms_sent'])
        email_count = sum(1 for r in results.values() if r['email_sent'])
        logger.info(f"Alert notifications sent: {sms_count} SMS, {email_count} emails to {len(contacts)} contacts")
        
        return results
    
    def get_location_string(self, alert: Alert) -> Optional[str]:
        """Get formatted location string from alert"""
        if not alert.location:
            return None
        
        location = alert.location
        if location.address:
            return location.address
        else:
            return f"Lat: {location.latitude:.6f}, Lng: {location.longitude:.6f}"


# Singleton instance
notification_service = NotificationService()

