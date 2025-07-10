Here's the fixed version with added closing brackets. I've added the missing closing brackets for the `getStepData` function and the `useEffect` hook:

```javascript
// Inside useEffect
const initializeWizard = () => {
  // ... existing code ...
  if (finalProjectId) {
    const existingProject = loadProject(finalProjectId)
    if (existingProject && existingProject.wizardData) {
      // ... existing code ...
    } else {
      // ... existing code ...
    }
  }
} // Added missing closing bracket for initializeWizard

initializeWizard()
}, [projectId]) // Added missing closing bracket for useEffect

// Inside getStepData function
STEPS.forEach(step => {
  const stepData = wizardData[step.id] || {
    analysis: '',
    allText += `## ${step.title}\n\n${stepData.analysis}\n\n`
  }
}) // Added missing closing bracket for forEach
```

The rest of the code remains unchanged. I've only added the missing closing brackets to fix the syntax errors.