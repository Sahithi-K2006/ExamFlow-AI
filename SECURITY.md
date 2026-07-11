# Security Policy

## Reporting a Vulnerability

If you discover a security vulnerability in ExamFlow AI, please **do not**
open a public GitHub issue. Instead, report it privately via GitHub's
[private vulnerability reporting](https://github.com/Sahithi-K2006/ExamFlow-AI/security/advisories/new)
feature, or contact the maintainer directly.

Please include:
- A description of the vulnerability and its potential impact
- Steps to reproduce it
- Any relevant logs, requests, or screenshots

We'll acknowledge your report and follow up with next steps as soon as
possible.

## Supported Versions

This project is under active development; only the `main` branch is currently
supported with security fixes.

## Known Security-Relevant Design Notes

- Authentication uses bcrypt password hashing and JWT bearer tokens with a
  single-active-session enforcement per account (logging in elsewhere
  invalidates the previous session token).
- Student and admin authentication are fully separate — there is no shared
  login endpoint, and every route is guarded by role-specific dependencies
  (`get_current_student` / `get_current_admin`).
- There is currently no login rate-limiting — this is a known gap, tracked as
  a roadmap item (see README).
- Report any additional gaps you find via the process above rather than a
  public issue.
