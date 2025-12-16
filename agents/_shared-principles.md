# Shared Software Engineering Principles

> **Reference Document**: This document contains common principles, patterns, and best practices referenced by all agent files. Do not duplicate this content in individual agent files.

## SOLID Principles

### Single Responsibility Principle (SRP)
- Each module/class should have one reason to change
- If you describe what it does with "and", it's doing too much
- **Example**: `UserAuthenticator` should only handle auth, not logging or storage

### Open/Closed Principle (OCP)
- Open for extension, closed for modification
- Use interfaces/traits for extension points
- **Example**: Plugin system where new plugins don't modify core

### Liskov Substitution Principle (LSP)
- Subtypes must be substitutable for base types
- Don't break contracts in subclasses
- **Example**: All `Storage` implementations should handle null keys the same way

### Interface Segregation Principle (ISP)
- Many specific interfaces better than one general interface
- Clients shouldn't depend on methods they don't use
- **Example**: `Readable` and `Writable` traits, not single `FileAccess`

### Dependency Inversion Principle (DIP)
- Depend on abstractions, not concretions
- High-level modules shouldn't depend on low-level modules
- **Example**: Business logic depends on `Storage` trait, not `SqliteStorage`

## Core Principles

### DRY (Don't Repeat Yourself)
- ✅ Extract common logic into functions
- ✅ Create abstractions for repeated patterns
- ❌ Copy-paste code with small variations
- **Rule**: If you write same code 3 times, extract it

### KISS (Keep It Simple, Stupid)
- ✅ Simplest solution that works
- ✅ Clear, readable code over clever code
- ❌ Premature optimization
- ❌ Unnecessary abstraction
- **Rule**: Can a junior developer understand it?

### YAGNI (You Aren't Gonna Need It)
- ✅ Implement only what's needed now
- ✅ Add features when requirements arrive
- ❌ Build "just in case" features
- ❌ Over-engineer for future possibilities
- **Rule**: If not in requirements, don't build it

### Separation of Concerns
- ✅ Each module handles one aspect
- ✅ Business logic separate from presentation
- ✅ Data access separate from business logic
- **Examples**: MVC, Clean Architecture, Hexagonal Architecture

### Principle of Least Surprise
- ✅ Functions do what their name suggests
- ✅ Behavior matches user expectations
- ❌ Hidden side effects
- ❌ Unexpected exceptions

### Fail Fast
- ✅ Validate inputs at boundaries
- ✅ Return errors immediately
- ❌ Let errors propagate deep into system
- ❌ Hide errors and continue

### Defensive Programming
- ✅ Validate inputs, handle edge cases
- ✅ Check preconditions and postconditions
- ✅ Use assertions for invariants

## Design Patterns

### Creational Patterns

**Factory Pattern**
- **When**: Object creation logic is complex
- **Use**: Centralize creation logic, support multiple implementations

**Builder Pattern**
- **When**: Objects have many configuration options
- **Use**: Step-by-step construction, optional parameters

**Singleton Pattern**
- **When**: Exactly one instance needed
- **Warning**: Use sparingly! Often indicates design problem

### Structural Patterns

**Adapter Pattern**
- **When**: Integrating incompatible interfaces
- **Use**: Wrap existing interface to match expected interface

**Facade Pattern**
- **When**: Simplifying complex subsystems
- **Use**: Provide simple interface to complex system

**Proxy Pattern**
- **When**: Controlling access or adding functionality
- **Use**: Lazy loading, access control, logging

**Decorator Pattern**
- **When**: Adding functionality dynamically
- **Use**: Wrap objects to add features without subclassing

### Behavioral Patterns

**Strategy Pattern**
- **When**: Algorithm varies by context
- **Use**: Swap algorithms at runtime

**Observer Pattern**
- **When**: One-to-many event notification needed
- **Use**: Decouple event source from handlers

**Command Pattern**
- **When**: Encapsulating actions as objects
- **Use**: Undo/redo, queuing, logging

### Concurrency Patterns

**Producer-Consumer**
- **When**: Decoupling data production from consumption
- **Use**: Queue-based communication between threads

**Reader-Writer Lock**
- **When**: Read-heavy workloads
- **Use**: Allow concurrent reads, exclusive writes

**Thread Pool**
- **When**: Managing concurrent tasks
- **Use**: Reuse threads, limit resource usage

### When to Use Patterns

**Use pattern when:**
- ✅ Pattern clearly fits problem
- ✅ Reduces complexity (not adds it)
- ✅ Team familiar with pattern
- ✅ Future extensibility expected

**Avoid pattern when:**
- ❌ Adds unnecessary abstraction
- ❌ Team unfamiliar (unless learning goal)
- ❌ Requirements too simple
- ❌ Pattern mismatch with problem

## Code Smells

### Architecture Smells

**God Object**
- One class/module doing too much
- **Fix**: Split into focused components

**Tight Coupling**
- Components too interdependent
- **Fix**: Introduce abstractions/interfaces

**Circular Dependencies**
- A depends on B, B depends on A
- **Fix**: Extract shared interface or dependency

**Feature Envy**
- Class uses another class's data more than its own
- **Fix**: Move method to data owner

**Shotgun Surgery**
- One change requires many modifications
- **Fix**: Consolidate related functionality

### Performance Smells

**N+1 Queries**
- Loop with database call per iteration
- **Fix**: Batch queries, use joins

**Premature Optimization**
- Optimizing without profiling
- **Fix**: Measure first, optimize bottlenecks

**Synchronous Blocking**
- Blocking operations in async context
- **Fix**: Use async/await, non-blocking I/O

**Memory Leaks**
- Unreleased resources
- **Fix**: Use RAII, ensure cleanup in finally blocks

### Security Smells

**Hardcoded Secrets**
- Credentials in code
- **Fix**: Use environment variables, secrets management

**Missing Validation**
- Trusting user input
- **Fix**: Validate and sanitize all inputs

**SQL Injection**
- Unparameterized queries
- **Fix**: Use parameterized queries/prepared statements

**Path Traversal**
- Unvalidated file paths
- **Fix**: Validate and sanitize paths, use whitelist

## Code Quality Guidelines

### Naming Conventions
- ✅ Clear, descriptive names: `calculate_total_price`
- ✅ Verb for functions: `get`, `set`, `calculate`, `validate`
- ✅ Noun for variables: `user_count`, `max_retries`
- ❌ Abbreviations: `calc_tot_pr`
- ❌ Single letters (except loop indices): `a`, `tmp`, `x`

### Function Size
- ✅ Small functions (< 50 lines)
- ✅ One level of abstraction per function
- ✅ Easy to test
- ❌ God functions (> 200 lines)
- **Rule**: If you scroll, it's too long

### Cognitive Complexity
- ✅ Limit nesting (max 3-4 levels)
- ✅ Early returns to reduce nesting
- ✅ Extract complex conditions to named functions
- ❌ Deep nesting (> 4 levels)

### Comments
- ✅ Explain WHY, not WHAT
- ✅ Document complex algorithms
- ✅ Warn about gotchas
- ❌ Comment obvious code
- ❌ Outdated comments

## Decision Guidelines

### Use Existing Library When:
- Problem is well-solved (HTTP client, JSON parsing)
- Security-critical (crypto, authentication)
- Complex implementation (parsers, compression)
- Standard compliance needed (protocols, formats)

### Build Custom Solution When:
- Requirements are unique to domain
- Existing solutions are overcomplicated for use case
- Learning opportunity for team
- Performance critical and libraries too heavy

### Use Design Pattern When:
- Pattern clearly fits problem
- Reduces complexity (not adds it)
- Team familiar with pattern
- Future extensibility expected

### Avoid Pattern When:
- Adds unnecessary abstraction
- Team unfamiliar (unless learning goal)
- Requirements too simple
- Pattern mismatch with problem

