# Tripple Thread Examples

This directory contains example code demonstrating various features and usage patterns of the Tripple Thread library.

## Running the Examples

To run any example:

```bash
# First build the project
npm run build

# Then run an example using ts-node
ts-node examples/01-basic-usage.ts
```

## Example Files

### 1. Basic Usage (`01-basic-usage.ts`)
Demonstrates the fundamental operations of the library:
- Creating a graph manager
- Adding individual triples
- Importing Turtle data
- Basic querying
- Exporting to Turtle format

### 2. Named Graphs (`02-named-graphs.ts`)
Shows how to work with multiple named graphs:
- Adding data to specific graphs
- Querying from specific graphs
- Managing data across different graphs
- Importing/exporting specific graphs

### 3. Error Handling (`03-error-handling.ts`)
Demonstrates proper error handling and best practices:
- Database connection errors
- Invalid RDF data handling
- Invalid triple handling
- Batch operation errors
- Resource cleanup

### 4. Real-World Usage (`04-real-world-usage.ts`)
A comprehensive example showing how to build a movie database:
- Organizing data with consistent URI patterns
- Working with complex relationships
- Managing different types of entities
- Running complex queries
- Best practices for large datasets

## Best Practices Demonstrated

1. **Resource Management**
   - Proper database connection handling
   - Using try/finally blocks
   - Closing connections properly

2. **Error Handling**
   - Graceful error recovery
   - User-friendly error messages
   - Proper cleanup on errors

3. **Data Organization**
   - Using named graphs effectively
   - Consistent URI patterns
   - Clear data structure

4. **Code Structure**
   - Clean and maintainable code
   - Well-documented examples
   - Proper TypeScript usage

## Additional Notes

- The examples use an in-memory SQLite database by default (`:memory:`), but you can modify them to use a file-based database
- Each example is self-contained and can be run independently
- Comments in the code explain each operation in detail
- Error handling patterns shown are production-ready

## Contributing

Feel free to add more examples or improve existing ones. When contributing:
1. Follow the existing code style
2. Add comprehensive comments
3. Update this README if adding new examples
4. Ensure examples are self-contained and runnable