# Mutual NDA Creator - Prototype

Simple web-based tool for creating customized Mutual Non-Disclosure Agreements.

## Usage

Open `index.html` in any modern web browser. No server or build process required.

### Features

- Interactive form with 6 customizable fields
- Real-time document preview with highlighted variables
- Download completed NDA as markdown file
- Clean legal-tech interface using ClauseAI color palette

### Form Fields

1. **Purpose** - Business purpose for sharing confidential information
2. **Effective Date** - Agreement start date
3. **MNDA Term** - Duration of the agreement (e.g., "2 years")
4. **Term of Confidentiality** - How long confidential information remains protected
5. **Governing Law** - US State whose laws govern the agreement
6. **Jurisdiction** - Location for resolving legal disputes

### Technical Details

**Stack:** Vanilla HTML, CSS, JavaScript (no dependencies)
**Template Source:** CommonPaper Mutual NDA (CC BY 4.0)
**File Size:** ~14KB single HTML file

## Testing

1. Open `index.html` in browser
2. Verify form fields populate preview with highlighted values
3. Change form values and confirm preview updates in real-time
4. Click "Download Mutual NDA" and verify markdown file downloads
5. Open downloaded file and confirm all placeholders are replaced

## Known Limitations

- Client-side only (no persistence or backend)
- Single template support (Mutual NDA only)
- Basic markdown formatting in preview
- No validation beyond required date field

## Next Steps

CL-4 will establish proper frontend/backend architecture, database, and dev automation.
