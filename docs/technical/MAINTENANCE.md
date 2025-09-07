# Documentation Maintenance Guide

## 🎯 Purpose

This guide ensures the technical documentation stays current and accurate as the QB Pharma system evolves.

## 📋 Maintenance Responsibilities

### When to Update Documentation

#### ✅ **MANDATORY Updates** (Must be done immediately)
- **New Transaction Types**: Adding or modifying transaction categories
- **Business Rule Changes**: Settlement logic, profit distribution algorithms
- **Stakeholder Role Changes**: New stakeholder types or permission changes  
- **API Changes**: New endpoints, modified request/response formats
- **Database Schema Changes**: New tables, fields, or relationships

#### 🔄 **Recommended Updates** (Should be done within 1 week)
- **UI/UX Improvements**: Major workflow changes affecting user experience
- **New Features**: Additional functionality that changes business processes
- **Performance Optimizations**: If they affect system behavior or limits

#### 📝 **Optional Updates** (Can be batched quarterly)
- **Bug Fixes**: Unless they change business logic significantly
- **Code Refactoring**: Internal improvements without external impact
- **Minor UI Tweaks**: Small styling or layout improvements

---

## 🔍 Documentation Review Checklist

### Monthly Review (15 minutes)
- [ ] Verify transaction types match `/frontend/src/constants/transactionTypes.ts`
- [ ] Check if any new business rules were implemented
- [ ] Review recent commit messages for business logic changes

### Quarterly Review (1 hour)
- [ ] Full documentation accuracy check against codebase
- [ ] Update examples with realistic current data
- [ ] Verify all links and references work correctly
- [ ] Check for outdated screenshots or UI references
- [ ] Update version numbers and last-modified dates

### Annual Review (2-3 hours)
- [ ] Complete restructuring review - is organization still optimal?
- [ ] User feedback integration - what questions come up frequently?
- [ ] Identify gaps - what's missing that would be helpful?
- [ ] Consider adding new sections based on system growth

---

## 🛠️ How to Update Documentation

### 1. **Before Making Code Changes**
```bash
# Check what documentation might be affected
grep -r "pharmacy_sale" docs/
grep -r "TransactionCategory" docs/
```

### 2. **After Code Changes**
- Update relevant documentation files
- Add new examples if business logic changed
- Verify cross-references are still accurate

### 3. **Testing Documentation Changes**
- Review rendered markdown for formatting
- Test all internal links work correctly
- Ensure code examples are syntactically correct

---

## 📁 File-Specific Maintenance

### `transaction-types.md`
- **Triggers**: Changes to `/frontend/src/constants/transactionTypes.ts`
- **What to Check**: Transaction descriptions, stakeholder requirements, cash flow impacts
- **Frequency**: Immediately when transaction types change

### `business-rules.md` *(Future)*
- **Triggers**: Changes to settlement logic, profit calculations, credit management
- **What to Check**: Mathematical formulas, business constraints, validation rules
- **Frequency**: Immediately when financial logic changes

### `stakeholder-roles.md` *(Future)*
- **Triggers**: Changes to role-based access, new stakeholder types
- **What to Check**: Permission matrices, role descriptions, access patterns
- **Frequency**: When user roles or permissions change

### `API Reference` *(Future)*
- **Triggers**: Backend API changes, new endpoints, modified responses
- **What to Check**: Endpoint URLs, request/response examples, authentication
- **Frequency**: With every backend API change

---

## 🤖 Automation Opportunities

### Git Hooks (Recommended)
```bash
# Pre-commit hook to remind about documentation
# File: .git/hooks/pre-commit
#!/bin/bash
if git diff --cached --name-only | grep -q "constants/transactionTypes.ts"; then
    echo "⚠️  WARNING: Transaction types changed. Consider updating docs/technical/business-domain/transaction-types.md"
fi
```

### GitHub Actions (Advanced)
- Automated checks for documentation freshness
- Link verification
- Spell checking and formatting validation

---

## 📞 Documentation Ownership

### Primary Maintainer
- **Who**: Lead Developer/Technical Lead
- **Responsibility**: Ensure critical updates happen immediately
- **Time Commitment**: ~30 minutes/month for reviews

### Secondary Maintainer  
- **Who**: Senior Developer
- **Responsibility**: Quarterly reviews and gap identification
- **Time Commitment**: ~1 hour/quarter

### Stakeholder Reviewers
- **Who**: Business Users/Domain Experts  
- **Responsibility**: Annual accuracy validation from business perspective
- **Time Commitment**: ~2 hours/year

---

## 🎯 Quality Standards

### Documentation Must Be:
- **Accurate**: Reflects current system behavior exactly
- **Complete**: Covers all major business scenarios  
- **Clear**: Understandable by developers new to the project
- **Current**: References correct versions and current examples
- **Linked**: Proper cross-references to related documentation and code

### Documentation Should Be:
- **Practical**: Includes real-world examples and use cases
- **Searchable**: Good headings and keyword usage
- **Maintainable**: Easy to find what needs updating
- **Versioned**: Clear about what version it describes

---

## 🚨 Emergency Updates

If critical business logic changes unexpectedly:

1. **Immediate**: Add a warning note to affected documentation
2. **Within 24 hours**: Update the core content accurately  
3. **Within 1 week**: Review all cross-references and examples
4. **Next quarterly review**: Full verification of accuracy

---

*This maintenance guide ensures QB Pharma's technical documentation remains a reliable source of truth.*