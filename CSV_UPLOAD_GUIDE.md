# CSV Upload System Guide

## Overview

The CSV Upload System allows administrators to upload content for Telugu Dictation and Vakya Nirmana (Sentence Formation) exercises through CSV files. The system automatically processes the uploaded content, validates it, and creates exercises with jumbled words for sentence formation.

## Features

### 1. Telugu Dictation CSV Upload
- Upload Telugu words with English meanings
- Automatic difficulty level assignment
- Support for easy, medium, and hard difficulty levels

### 2. Sentence Formation CSV Upload
- **English to Telugu**: Upload English sentences with Telugu meanings
- **Telugu to English**: Upload Telugu sentences with English meanings
- Automatic word breaking and jumbling for exercises

## CSV File Formats

### Telugu Dictation Format
```csv
telugu_word,english_meaning,difficulty
పాఠశాల,school,easy
ఇంటి,house,medium
పుస్తకం,book,hard
```

**Required Columns:**
- `telugu_word`: The Telugu word for dictation
- `english_meaning`: English translation for reference
- `difficulty`: easy, medium, or hard

### English to Telugu Sentence Formation Format
```csv
english_sentence,telugu_meaning,difficulty
I am going to school,నేను పాఠశాలకు వెళుతున్నాను,easy
Guests came to our house,మా ఇంటికి అతిథులు వచ్చారు,medium
Students are reading books,విద్యార్థులు పుస్తకాలు చదువుతున్నారు,hard
```

**Required Columns:**
- `english_sentence`: The English sentence to be formed
- `telugu_meaning`: Telugu translation for reference
- `difficulty`: easy, medium, or hard

### Telugu to English Sentence Formation Format
```csv
telugu_sentence,english_meaning,difficulty
నేను పాఠశాలకు వెళుతున్నాను,I am going to school,easy
మా ఇంటికి అతిథులు వచ్చారు,Guests came to our house,medium
విద్యార్థులు పుస్తకాలు చదువుతున్నారు,Students are reading books,hard
```

**Required Columns:**
- `telugu_sentence`: The Telugu sentence to be formed
- `english_meaning`: English translation for reference
- `difficulty`: easy, medium, or hard

## How to Use

### 1. Access Admin Dashboard
- Login as an administrator
- Navigate to the Admin Dashboard
- Click on the "CSV Upload" tab

### 2. Upload CSV Files
1. Select the exercise type from the dropdown:
   - Telugu Dictation
   - English to Telugu Sentence Formation
   - Telugu to English Sentence Formation

2. Click "Download Template" to get the correct CSV format

3. Fill in your data following the template format

4. Click "Choose File" and select your CSV file

5. Click "Upload" to process the file

### 3. Monitor Upload Status
- View upload progress and status
- Check for any validation errors
- See the number of records processed

## File Requirements

### File Format
- Must be a `.csv` file
- UTF-8 encoding recommended for Telugu text
- Maximum file size: 5MB

### Data Validation
- All required columns must be present
- Difficulty levels must be: easy, medium, or hard
- No empty rows or missing data
- Telugu text should be properly formatted
- For dictation: Use individual words, not sentences

## Automatic Processing

### Word Breaking and Jumbling
For sentence formation exercises, the system automatically:
1. Breaks sentences into individual words
2. Removes punctuation marks
3. Creates jumbled versions of the words
4. Maintains the correct order for answer validation

### Example Processing:
**Input:** "I am going to school"
**Processed:**
- Original words: ["I", "am", "going", "to", "school"]
- Jumbled words: ["school", "I", "to", "am", "going"]
- Correct order: [1, 3, 4, 2, 0]

## Error Handling

### Common Errors
1. **Invalid file format**: Only CSV files are accepted
2. **Missing columns**: All required columns must be present
3. **Invalid difficulty**: Must be easy, medium, or hard
4. **Empty data**: No empty rows or missing values
5. **File size**: Maximum 5MB file size limit
6. **Dictation format**: Use individual words, not sentences for dictation

### Error Messages
The system provides detailed error messages for:
- Validation failures
- File format issues
- Network errors
- Server processing errors

## Sample Files

Sample CSV files are provided in the `sample-csv-files/` directory:
- `dictation-sample.csv`
- `sentence-formation-en-te-sample.csv`
- `sentence-formation-te-en-sample.csv`

## API Endpoints

### Upload CSV
```
POST /api/csv-upload/upload
Content-Type: multipart/form-data
Authorization: Bearer <token>

Body:
- csvFile: CSV file
- exerciseType: dictation | sentence-formation-en-te | sentence-formation-te-en
```

### Download Template
```
GET /api/csv-upload/template/{type}
Authorization: Bearer <token>

Response: CSV file download
```

### Get Exercises
```
GET /api/csv-upload/exercises/{type}?page=1&limit=10&difficulty=easy
Authorization: Bearer <token>

Response: JSON with exercises and pagination
```

## Security

- Only administrators can upload CSV files
- Authentication required for all endpoints
- File validation and sanitization
- Automatic cleanup of uploaded files after processing

## Troubleshooting

### Upload Issues
1. Check file format (must be .csv)
2. Verify all required columns are present
3. Ensure difficulty levels are correct
4. Check file size (max 5MB)

### Processing Issues
1. Verify Telugu text encoding (UTF-8)
2. Check for special characters
3. Ensure sentences are properly formatted
4. Contact administrator for server issues

## Best Practices

1. **Use templates**: Always download and use the provided templates
2. **Test with small files**: Start with a few records to test the format
3. **Validate data**: Check your data before uploading
4. **Backup data**: Keep copies of your CSV files
5. **Monitor uploads**: Check the status of your uploads regularly

## Support

For technical support or questions about the CSV upload system:
1. Check this documentation first
2. Review error messages carefully
3. Contact the system administrator
4. Report bugs or issues through the appropriate channels
