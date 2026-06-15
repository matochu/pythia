# Planning Best Practices

**Purpose**: Guidelines for creating effective plans. Ensures plans are actionable, well-structured, and consider alternatives.

## When Creating Plans

1. **Break into Phases**
   - Each phase has clear scope and deliverables
   - Phases build on each other logically
   - Time estimates are realistic (add 20% buffer)

2. **Identify Dependencies**
   - List what must be done before each phase
   - Highlight external dependencies (other teams, APIs)
   - Note blocking vs non-blocking dependencies

3. **Define Success Criteria**
   - Make criteria measurable and verifiable
   - Include both functional and non-functional requirements
   - Specify test scenarios

4. **Consider Alternatives**
   - Always evaluate multiple approaches
   - Don't just go with "obvious" solution
   - Document why alternatives were rejected

## When Reviewing Implementations

1. **Check Against Requirements**
   - Compare code against task document
   - Verify all objectives met
   - Check edge cases handled

2. **Verify Architecture**
   - Ensure follows planned design
   - Check for architectural anti-patterns
   - Verify integration points work as expected

3. **Assess Quality**
   - Error handling comprehensive?
   - Thread safety considered?
   - Resource cleanup proper?
   - Code clear and maintainable?

4. **Provide Actionable Feedback**
   - Specific file paths and line numbers
   - Clear description of problem
   - Concrete recommendation for fix
   - Estimate of effort to fix

## Plan Structure Guidelines

- **Clear Objectives**: What are we trying to achieve?
- **Scope Definition**: What's in scope vs out of scope?
- **Phased Approach**: Break complex work into manageable phases
- **Risk Assessment**: Identify potential problems upfront
- **Success Criteria**: How do we know we're done?
- **Dependencies**: What blocks us or what do we block?

## Response Structure for Planning

Every planning response should follow this structure:

1. **Requirements Summary**: What needs to be built/achieved
2. **Approach Evaluation**: 3-5 options with pros/cons/trade-offs
3. **Risk Analysis**: Potential problems and mitigations
4. **Recommended Plan**: Detailed implementation phases
5. **Success Criteria**: How to verify completion
