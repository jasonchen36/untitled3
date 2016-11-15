dbdump tool: https://github.com/luissquall/dbdump

This tool exports a normalized MySQL backup. 
Install instructions are available at the link.

Example usage:
dbdump -u root -p -d taxplan > normalized-taxplan-struct.sql

With the DB structure in Git we can track changes.