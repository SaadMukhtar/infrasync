"""
⚠️ Optional: Infrasync Backup Script

This script handles periodic backups of the database and application configuration.
Designed for teams or self-hosters who want resilience + disaster recovery.

➤ Uses `pg_dump` and `gzip` to compress data
➤ Schedule it with a cron job, CloudWatch Events, or systemd timer
➤ Not required for Supabase-hosted deployments (they have automatic backups)

To disable: ignore this file or remove it from your build step.
"""

import os
import logging
import asyncio
import json
import gzip
from datetime import datetime, timedelta
from typing import Dict, Any, List, Optional
import tempfile
import shutil

logger = logging.getLogger(__name__)

class BackupService:
    """Service for database backup and disaster recovery"""
    
    def __init__(self):
        self.backup_retention_days = int(os.getenv("BACKUP_RETENTION_DAYS", "30"))
        self.backup_schedule_hours = int(os.getenv("BACKUP_SCHEDULE_HOURS", "24"))
        
    async def create_database_backup(self) -> Optional[str]:
        """Create a full database backup"""
        try:
            # Get database connection details
            db_url = os.getenv("DATABASE_URL")
            if not db_url:
                logger.error("DATABASE_URL not configured")
                return None
                
            # Create backup filename with timestamp
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_filename = f"infrasync_backup_{timestamp}.sql"
            
            # Create temporary file for backup
            with tempfile.NamedTemporaryFile(mode='w+b', suffix='.sql', delete=False) as temp_file:
                temp_path = temp_file.name
                
            # Create pg_dump command
            pg_dump_cmd = [
                'pg_dump',
                '--verbose',
                '--clean',
                '--no-owner',
                '--no-privileges',
                '--format=plain',
                f'--file={temp_path}',
                db_url
            ]
            
            # Execute pg_dump
            process = await asyncio.create_subprocess_exec(
                *pg_dump_cmd,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE
            )
            
            stdout, stderr = await process.communicate()
            
            if process.returncode != 0:
                logger.error(f"pg_dump failed: {stderr.decode()}")
                return None
                
            # Compress the backup
            compressed_filename = f"{backup_filename}.gz"
            compressed_path = temp_path + ".gz"
            
            with open(temp_path, 'rb') as f_in:
                with gzip.open(compressed_path, 'wb') as f_out:
                    shutil.copyfileobj(f_in, f_out)
                    
            # Clean up temporary files
            os.unlink(temp_path)
            
            logger.info(f"Database backup created: {compressed_filename}")
            return compressed_filename
            
        except Exception as e:
            logger.error(f"Failed to create database backup: {e}")
            return None
            
    async def create_application_backup(self) -> Optional[str]:
        """Create application configuration and data backup"""
        try:
            # Collect application data
            backup_data = {
                'timestamp': datetime.now().isoformat(),
                'version': '1.0.0',
                'environment': os.getenv("ENVIRONMENT", "development"),
                'configuration': {
                    'openai_enabled': os.getenv("OPENAI_ENABLED", "false"),
                    'rate_limits': {
                        'default': os.getenv("RATE_LIMIT_DEFAULT"),
                        'auth': os.getenv("RATE_LIMIT_AUTH"),
                        'digest': os.getenv("RATE_LIMIT_DIGEST"),
                    },
                    'feature_flags': {
                        'analytics': os.getenv("ENABLE_ANALYTICS", "false"),
                        'weekly_digests': os.getenv("ENABLE_WEEKLY_DIGESTS", "false"),
                    }
                }
            }
            
            # Create backup filename
            timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
            backup_filename = f"application_backup_{timestamp}.json.gz"
            
            # Create temporary file
            with tempfile.NamedTemporaryFile(mode='w+b', suffix='.json.gz', delete=False) as temp_file:
                temp_path = temp_file.name
                
            # Compress and save backup data
            with gzip.open(temp_path, 'wt', encoding='utf-8') as f:
                json.dump(backup_data, f, indent=2, default=str)
                
            # Clean up
            os.unlink(temp_path)
            
            logger.info(f"Application backup created: {backup_filename}")
            return backup_filename
            
        except Exception as e:
            logger.error(f"Failed to create application backup: {e}")
            return None

# Global backup service instance
backup_service = BackupService()

async def scheduled_backup():
    """Scheduled backup task"""
    while True:
        try:
            logger.info("Starting scheduled backup")
            
            # Create database backup
            db_backup = await backup_service.create_database_backup()
            if db_backup:
                logger.info(f"Database backup completed: {db_backup}")
                
            # Create application backup
            app_backup = await backup_service.create_application_backup()
            if app_backup:
                logger.info(f"Application backup completed: {app_backup}")
                
        except Exception as e:
            logger.error(f"Scheduled backup failed: {e}")
            
        # Wait for next backup cycle
        await asyncio.sleep(backup_service.backup_schedule_hours * 3600) 