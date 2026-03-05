# Database Backup & Restore

*Status: Active*

This document holds the standard operating procedures for taking snapshots of the MySQL database and performing point-in-time recovery during disaster scenarios.

## Neon/Railway Automated Backups

Our MySQL instance is currently hosted remotely.

- **Snapshot Frequency**: The provider automatically takes daily full-volume snapshots.
- **Retention Rate**: Backups are retained for 7 days on the standard dev tier.

## Manual Export SOP

Before performing massive or risky bulk operations (e.g., executing a script to delete thousands of "failed" transcriptions), export a manual `.sql` dump.

```bash
# Export the entire public schema to a local file
mysqldump -u <username> -p -h <host> <database_name> > manual_backup_$(date +%F).sql
```

## Point-in-Time Recovery

If the database is corrupted (e.g., all postcards accidentally deleted via a malicious or errored `DELETE` statement without a `WHERE` clause):

1. **Stop the Worker**: Immediately kill the production backend to ensure no new data is being written to the corrupted state.
2. **Access Console**: Log in to the database hosting provider's dashboard.
3. **Trigger Restore**: Navigate to the "Backups" tab and select the most recent automated snapshot *prior* to the corruption event.
4. **Resync**: Once restored, any images scraped *after* the backup but *before* the crash may be orphaned in S3. These will eventually be cleaned up by an administrative script.
