# Spec Delta

## Purpose

Provide public terms of use and privacy policies on each official or self-hosted instance in Portuguese and English, so registration applicants and visitors can read stable documents.

## ADDED Requirements

### Requirement: Public terms and privacy pages

The system SHALL expose `/terms` and `/privacy` on the web application's origin without authentication. Each page SHALL show its document in the active UI language (at least pt-BR and en). Pages SHALL be readable on desktop and mobile, have a single `h1` per document, and SHALL NOT require a session or authenticated requests.

#### Scenario: Visitor opens terms

- **WHEN** a visitor without a session navigates to `/terms`
- **THEN** they see the terms of use in the active language

#### Scenario: Visitor opens privacy

- **WHEN** a visitor without a session navigates to `/privacy`
- **THEN** they see the privacy policy in the active language

### Requirement: Official instance identifies its natural-person controller

Documents served by the official Parley instance SHALL explicitly identify the controller as a natural person, including their full name and a contact method in both terms and privacy text. They SHALL NOT omit the identity or substitute only the generic Parley brand for the responsible person.

#### Scenario: Official privacy names the controller

- **WHEN** a visitor reads `/privacy` on the official instance
- **THEN** the text identifies the responsible natural person and a contact method

### Requirement: Self-hosted template with operator placeholders

For installations other than the official instance, the system SHALL provide terms and privacy templates with clear placeholders for operator name or legal name, contact, and jurisdiction. Operator documentation SHALL require replacing these with real values before enabling open registration. The system MAY serve the unconfigured template by default, but SHALL NOT present it as the official Parley policy.

#### Scenario: Self-hosted instance shows a distinguishable template

- **WHEN** a visitor reads `/terms` on a self-hosted instance using the default template
- **THEN** the text clearly states that the instance operator is responsible and shows which identity fields must be configured

### Requirement: Content reflects the real product

Documents SHALL reflect documented behavior, including end-to-end encryption of messages and media where applicable, visible metadata, account email when email registration is active, and known limits in `docs/e2ee-gaps.md`. They SHALL NOT promise anonymity, complete absence of logs, or unimplemented capabilities.

#### Scenario: No anonymity promise

- **WHEN** a visitor reads the privacy policy
- **THEN** they find no claim of absolute anonymity or that the operator never stores metadata required by the service
