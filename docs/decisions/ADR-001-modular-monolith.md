# ADR-001: Modular monolith

Status: Accepted

## Decision
Use one NestJS deployment organized into business modules. Avoid distributed infrastructure until independently scalable workloads and operational evidence justify extraction.

## Consequences
Simpler local development, transactions and deployment. Module boundaries must remain explicit.
