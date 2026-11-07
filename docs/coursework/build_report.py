"""Rebuild the English coursework report using the bundled document runtime."""
from pathlib import Path
import json
import re
import subprocess
from datetime import datetime
from docx import Document
from docx.shared import Inches, Pt, Cm, RGBColor
from docx.enum.text import WD_ALIGN_PARAGRAPH
from docx.enum.table import WD_TABLE_ALIGNMENT, WD_CELL_VERTICAL_ALIGNMENT
from docx.oxml import OxmlElement
from docx.oxml.ns import qn
from PIL import Image, ImageDraw, ImageFont
from report_sections import (section_a, section_c_data, section_c_ui, section_e_boundaries,
                             section_f_coverage, section_f_team, section_f_review,
                             section_f_http, section_f_build)

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'output/coursework'
OUT.mkdir(parents=True, exist_ok=True)
DOC = Document()
section = DOC.sections[0]
section.page_width, section.page_height = Cm(21), Cm(29.7)
section.top_margin, section.bottom_margin = Cm(1.8), Cm(1.7)
section.left_margin = section.right_margin = Cm(1.9)
section.header_distance = section.footer_distance = Cm(.75)
for name in ['Normal', 'Title', 'Subtitle', 'Heading 1', 'Heading 2', 'Heading 3']:
    style = DOC.styles[name]
    style.font.name = 'Calibri'
    style.font.color.rgb = RGBColor(0, 0, 0)
    style.paragraph_format.space_after = Pt(7)
DOC.styles['Normal'].font.size = Pt(10.5)
DOC.styles['Normal'].paragraph_format.line_spacing = 1.12
for name, size in [('Title', 34), ('Heading 1', 23), ('Heading 2', 13), ('Heading 3', 11)]:
    DOC.styles[name].font.size = Pt(size)
    DOC.styles[name].font.bold = name != 'Title'
    DOC.styles[name].paragraph_format.keep_with_next = True
DOC.styles['Subtitle'].font.size = Pt(15)
head = section.header.paragraphs[0]
head.text = 'SAAN     /     CPE 334 SOFTWARE ENGINEERING'
head.runs[0].font.size = Pt(8)
foot = section.footer.paragraphs[0]
foot.alignment = WD_ALIGN_PARAGRAPH.RIGHT
foot.add_run('Saan  |  Project Deliverable 1  |  ')
field = OxmlElement('w:fldSimple'); field.set(qn('w:instr'), 'PAGE'); foot._p.append(field)
for run in foot.runs: run.font.size = Pt(8)
DOC.core_properties.title = 'Saan Engineering Baseline and Sprint 1'
DOC.core_properties.subject = 'CPE 334 Project Deliverable 1'
DOC.core_properties.author = 'Saan project team'
DOC.core_properties.keywords = 'Saan, CPE 334, SRS, SDS, Sprint 1'

PAGES = []
def page(part, title, subtitle=None):
    new_page = bool(PAGES)
    PAGES.append((part, title))
    p = DOC.add_paragraph(part.upper()); p.runs[0].font.size = Pt(9)
    p.paragraph_format.page_break_before = new_page
    DOC.add_paragraph(title, 'Title') if len(PAGES) == 1 else DOC.add_heading(title, 1)
    if subtitle: para(subtitle)

def para(text, style=None):
    return DOC.add_paragraph(text, style)

def sub(title, text=None):
    DOC.add_heading(title, 2)
    if text: para(text)

def table(headers, rows, widths):
    t = DOC.add_table(rows=1, cols=len(headers)); t.alignment = WD_TABLE_ALIGNMENT.CENTER
    t.autofit = False
    for col, width in zip(t.columns, widths): col.width = Cm(width)
    for cell, width, text in zip(t.rows[0].cells, widths, headers):
        cell.width = Cm(width); cell.text = text
    repeat = OxmlElement('w:tblHeader'); t.rows[0]._tr.get_or_add_trPr().append(repeat)
    for row in rows:
        cells = t.add_row().cells
        for c, w, text in zip(cells, widths, row): c.width = Cm(w); c.text = str(text)
    for i, row in enumerate(t.rows):
        pr = row._tr.get_or_add_trPr(); ns = OxmlElement('w:cantSplit'); pr.append(ns)
        for cell in row.cells:
            cell.vertical_alignment = WD_CELL_VERTICAL_ALIGNMENT.CENTER
            tcp = cell._tc.get_or_add_tcPr()
            sh = OxmlElement('w:shd'); sh.set(qn('w:fill'), '27333E' if i == 0 else ('F3F5F6' if i % 2 == 0 else 'FFFFFF')); tcp.append(sh)
            borders = OxmlElement('w:tcBorders')
            for edge in ['top', 'left', 'bottom', 'right']:
                e = OxmlElement('w:'+edge); e.set(qn('w:val'), 'single'); e.set(qn('w:sz'), '4'); e.set(qn('w:color'), 'D9D9D9'); borders.append(e)
            tcp.append(borders)
            mar = OxmlElement('w:tcMar')
            for edge in ['top', 'left', 'bottom', 'right']:
                e=OxmlElement('w:'+edge); e.set(qn('w:w'), '85'); e.set(qn('w:type'), 'dxa'); mar.append(e)
            tcp.append(mar)
            for p in cell.paragraphs:
                p.paragraph_format.space_after = Pt(2); p.paragraph_format.line_spacing = 1.05
                for r in p.runs:
                    r.font.size = Pt(9)
                    if i == 0: r.font.bold = True; r.font.color.rgb = RGBColor(255,255,255)
    DOC.add_paragraph().paragraph_format.space_after = Pt(1)
    return t

def code(text):
    p = DOC.add_paragraph()
    p.paragraph_format.space_before = Pt(5)
    for i, line in enumerate(text.strip().splitlines()):
        r = p.add_run(('\n' if i else '')+line); r.font.name = 'Consolas'; r.font.size = Pt(8.5)
    return p

def diagram(name, boxes, arrows, height=440):
    im = Image.new('RGB', (1440,height), 'white'); d = ImageDraw.Draw(im)
    f = ImageFont.truetype('C:/Windows/Fonts/calibri.ttf', 27)
    for x,y,w,h,label in boxes:
        d.rounded_rectangle((x,y,x+w,y+h),radius=10,fill='#F3F5F6',outline='#8B959B',width=2)
        lines=label.split('\n')
        for i,line in enumerate(lines):
            bb=d.textbbox((0,0),line,font=f); tw=bb[2]-bb[0]
            d.text((x+(w-tw)/2,y+(h-len(lines)*34)/2+i*34),line,font=f,fill='#17212A')
    for x1,y1,x2,y2 in arrows:
        d.line((x1,y1,x2,y2),fill='#C44532',width=4)
        if x2>x1: tri=[(x2,y2),(x2-13,y2-7),(x2-13,y2+7)]
        elif y2>y1: tri=[(x2,y2),(x2-7,y2-13),(x2+7,y2-13)]
        else: tri=[(x2,y2),(x2+13,y2-7),(x2+13,y2+7)]
        d.polygon(tri,fill='#C44532')
    target=OUT/name; im.save(target)
    DOC.add_picture(str(target), width=Cm(17.1))
    pic=DOC.inline_shapes[-1]; pic._inline.docPr.set('descr', name.replace('_',' ').replace('.png',''))

def evidence_picture(name, description, width=17.1):
    target=ROOT/'docs/coursework/evidence/images'/name
    if not target.exists():
        para('Screenshot evidence has not been captured for this render.')
        return
    DOC.add_picture(str(target),width=Cm(width))
    DOC.inline_shapes[-1]._inline.docPr.set('descr',description)

sha=subprocess.check_output(['git','rev-parse','HEAD'],cwd=ROOT,text=True).strip()
evidence=ROOT/'docs/coursework/evidence/integration-date-after-2026-11-07.txt'
raw=evidence.read_text(encoding='utf-8-sig',errors='replace') if evidence.exists() else ''
counts={k:re.findall(r'# '+k+r' (\d+)',raw) for k in ['tests','pass','fail','skipped']}
finished=all(counts[k] for k in counts)

page('CPE 334  /  Project Deliverable 1','Saan Engineering Baseline and Sprint 1')
para('Shrine products and service marketplace', 'Subtitle')
para('Semester 1 of 2026\nUpdated 7 November 2026\nAssignment deadline 8 November 2026 at 23:59')
sub('Purpose and proposed assessment scope',
    'Saan connects customers with shrine shops and service providers. This report organizes the existing product into the engineering baseline required for Parts A to F and proposes an assessed journey from catalog selection to a persisted, deposit-backed appointment confirmed by the owning shop.')
para('The application remains Thai-language. This report is written in English. Payments in the assessed environment are simulated or provider test transactions; no real payment or public identity verification is claimed.')
table(['Submission detail','Value'],[
    ('Student 1','Suwiwat Sinsomboon, 67070503444'),
    ('Student 2','Supanut Sopha, 67070503441'),
    ('Repository','https://github.com/iceswift/saan_webapp'),
    ('Inspected baseline',sha),
    ('Proposed application release','9377577047bf210c5e72da0cf7fbab5733451fa0; integrated main, awaiting final student acceptance'),
    ('Assigned theme','Pending comparison with group_work_specs.docx'),
], [4,13.2])
sub('Submission readiness',
    'The existing implementation predates these course contracts. The owner integrated the published baseline and verified calendar correction through PRs 10 and 11. Supanut posted review and execution summaries in Issues 4, 5 and 8; their 23 supporting files are included through PR 14 at 99171fd. Course-theme/reuse compliance, required substantive PR review and final student acceptance remain open. The closing Part F update distinguishes current results from the historical visual evidence.')

page('Navigation','Report contents')
para('Parts A to D describe the product baseline and proposed allocation. Part E records the Sprint 1 contracts as of this report. Part F distinguishes inspected implementation, executed checks and evidence that still needs to be collected.')
navigation_table = table(['Part','Pages','Content and identifiers'],[
    ('A','3 to 4','SRS, actors and scope; FR-01 to FR-09; BR-01 to BR-06; NFR-01 to NFR-05'),
    ('B','5','Feature inventory and traceability; F-01 to F-09'),
    ('C','6 to 8','System SDS, data ownership, application interfaces and deployment design'),
    ('D','9','Three-sprint allocation and dependencies'),
    ('E','13 to 17','Contracts F-01 to F-04; AC-01 to AC-12; TEST-01 to TEST-12; DoD'),
    ('F','18 to 27','History, local results, HTTP and visual evidence, coverage and team verification'),
], [1.3,2.2,13.7])
sub('Evidence vocabulary',
    'Inspected means the source or assertion was read. Executed means a command was run and its output retained. Historical means a dated repository record describes a prior run. Planned means the check or activity has not been completed for the assessed release. These terms are intentionally distinct.')
sub('Reading the application contracts',
    'Next.js Server Actions are the main mutation interface. Their function names and typed payloads are documented instead of invented REST paths. Existing HTTP routes remain separate boundaries. Service-level tests support business-rule claims but do not by themselves establish the entire browser-to-session authorization path.')
sub('Source references',
    'The principal sources are the supplied eight-page Project Deliverable 1 brief, the inspected Git baseline, Prisma schema, server actions and services, and dated deployment records. Detailed source paths and the release evidence plan appear in Part F. The unprovided course master specification remains authoritative for theme assignment.')

page('Part A','Product context and scope')
sub('Problem and stakeholders',
    'Customers arranging shrine purchases and related installation, repair or removal need to compare offerings, communicate site requirements and track an agreed job. Shops need structured requests, a reliable appointment state and an auditable record. Saan brings these activities into a single marketplace. No measured market demand or user-study outcome is asserted here.')
table(['Actor','Responsibility','Record boundary'],[
    ('Visitor','Browse public products and verified shop profiles','Public catalog and explicitly public shop fields'),
    ('Customer','Create orders, supply site details, pay in the test environment and track own jobs','Own orders, requests, shrines, vows and messages'),
    ('Provider','Maintain own catalog and profile; confirm and report assigned work','Own shop and its assigned orders'),
    ('Administrator','Review providers and inspect operational or financial queues','Explicitly authorized administrative views'),
], [2.5,7.2,7.5])
sub('Whole product baseline',
    'The baseline includes identity, verified catalog discovery, installation orders, service requests and quotes, work tracking, private shrine and vow records, owner-maintained shop locations, communication and administrative oversight. A feature inventory links these responsibilities to the proposed three-sprint course plan.')
sub('Sprint 1 boundary',
    'Use seeded synthetic accounts and a verified provider. A customer selects an active shrine and optional same-shop services, submits a future date and address, and receives an order. A test deposit moves the order to the shop queue. The owning verified provider confirms an available future appointment; the customer retrieves the saved outcome. Negative cases include blocked dates and another user attempting confirmation.')
sub('Explicit exclusions',
    'Real-money collection, payout and tax settlement; production SMS; custom shrine manufacturing dimensions; crane scheduling; third-party freight tracking; guaranteed religious outcomes; full public launch; and a claim of certified accessibility are excluded from this increment. Existing broader features remain disclosed but are not automatically part of Sprint 1 acceptance.')

page('Part A','Requirements and business rules')
table(['ID','Observable requirement','Feature'],[
    ('FR-01','Establish current-user identity and invalidate the session on logout.','F-01'),
    ('FR-02','Browse active products from verified providers and inspect price and shop.','F-02'),
    ('FR-03','Persist an installation order and retrieve its saved items and status.','F-03'),
    ('FR-04','Record a test deposit and let the owning verified provider confirm an appointment.','F-04'),
    ('FR-05','Submit a service request and compare provider quotes.','F-05'),
    ('FR-06','Track work, exchange messages and submit an eligible review.','F-06'),
    ('FR-07','Manage private shrine and vow records.','F-07'),
    ('FR-08','Maintain public shop details and discover approximate shop pins.','F-08'),
    ('FR-09','Review providers and inspect operational and financial queues.','F-09'),
], [1.7,13,2.5])
table(['ID','Business rule'],[
    ('BR-01','Order pricing is computed on the server from active products and same-provider packages; the current deposit rate is 30 percent.'),
    ('BR-02','Order submission requires a supported service area and at least one available preferred date after today in Bangkok.'),
    ('BR-03','Confirmation requires the owning verified provider, AWAITING_PROVIDER state and a future appointment on an open Bangkok date.'),
    ('BR-04','Repeated or competing financial and order transitions must not duplicate their final effects.'),
    ('BR-05','Private records are visible only to their owner or explicitly authorized participants and administrators.'),
    ('BR-06','OTP redemption is single use; an older code cannot become valid when the newest code is consumed, expired or locked.'),
], [1.7,15.5])
para('NFR-01 access: zero private fields returned in the selected forbidden-access cases, verified by backend and UI checks in Sprint 1. NFR-02 atomicity: confirmation failure leaves status, event and notification counts unchanged, verified in Sprint 1. NFR-03 usability: target 44 CSS-pixel controls and no document overflow at a 325 CSS-pixel viewport with normal and large text, checked in Sprint 3. NFR-04 reproducibility: a clean synthetic setup and documented build/test commands, checked in Sprint 1. NFR-05 durability: restore a backup into an isolated empty target and compare selected records and upload hashes, checked in Sprint 3. These are acceptance targets, not universal certification claims.')
section_a(page, para, sub, table, code)

page('Part B','Feature inventory and traceability')
para('The proposed course allocation covers this declared baseline. Much of the implementation already exists; sprint allocation describes assessment and remaining engineering work, not its original chronology.')
table(['Feature','Requirement coverage','Dependency','Sprint and verification'],[
    ('F-01 Identity','FR-01; BR-05,06; NFR-01,04','Synthetic seed and session store','1; AC-01 to 03; TEST-01 to 03'),
    ('F-02 Catalog','FR-02; BR-01','Verified shop and active product','1; AC-04; TEST-04'),
    ('F-03 Order creation','FR-03; BR-01,02,05; NFR-01,04','F-01, F-02','1; AC-05 to 07; TEST-05 to 07'),
    ('F-04 Deposit and confirmation','FR-04; BR-03,04,05; NFR-01,02','F-03 and mock gateway','1; AC-08 to 12; TEST-08 to 12'),
    ('F-05 Requests and quotes','FR-05; BR-01,05','F-01 and verified provider','2; new contracts before further work'),
    ('F-06 Work and communication','FR-06; BR-04,05','F-03 and F-04','2; completion, messaging and review tests'),
    ('F-07 Personal records','FR-07; BR-05','F-01 and optional completed job','3; owner isolation and persistence checks'),
    ('F-08 Shop discovery','FR-08; BR-05; NFR-03','Verified provider and public projection','3; projection, keyboard and narrow-layout checks'),
    ('F-09 Oversight and operations','FR-09; BR-04,05; NFR-01,05','Role checks, journals and backup tooling','3; restricted views, reconciliation and restore drill'),
], [3.1,5,3.6,5.5])
sub('Cross cutting responsibilities',
    'Authorization is established in F-01 and verified again at every protected feature. Atomic transitions belong to F-04 and F-06, with operational reconciliation in F-09. Reproducibility is established in Sprint 1 and maintained in subsequent releases. Inclusive interaction and durable recovery receive explicit Sprint 3 verification.')
sub('Coverage and change control',
    'All declared FR, BR and NFR identifiers have an owner and sprint. Detailed later-sprint acceptance criteria are intentionally not presented as complete. Assigned-theme coverage is unresolved until the master specification is available. Changes require a dated decision, updated traceability and a genuine teammate review; proposed changes are not approved changes.')

page('Part C','Architecture and application boundaries')
para('Saan is a modular Next.js application rather than separately deployed frontend and API services. React pages and client components call server actions; services enforce domain rules and use Prisma for persistence. Server-rendered queries return bounded view data. External integrations sit behind explicit payment, storage and runtime-policy boundaries.')
diagram('system_architecture.png',[
    (20,40,300,130,'Customer or provider\nBrowser UI'),
    (420,40,350,130,'Next.js application\nActions and queries'),
    (870,40,540,130,'Domain services\nRules and transactions'),
    (870,285,240,120,'Prisma\nDatabase'),
    (1170,285,240,120,'Gateway and\nlocal uploads'),
],[(320,105,420,105),(770,105,870,105),(990,170,990,285),(1290,170,1290,285)])
para('Figure 1. Logical application layers. Arrows show calls, not independently deployed services.')
table(['Component','Inspected responsibility'],[
    ('src/app and src/components','Thai screens, navigation, forms, state feedback and shared accessible controls'),
    ('src/server/actions','Derive current identity, validate payloads and delegate protected mutations'),
    ('src/server/queries.ts','Read records and construct authorized page data'),
    ('Domain services','Order confirmation, payment state, OTP consumption and other domain rules'),
    ('Prisma and storage','Relational persistence and uploaded-file boundary'),
], [5.3,11.9])
sub('Stack and decisions',
    'The inspected package uses Next.js 16.4.5, React 19.3, TypeScript, Tailwind CSS 4 and Prisma 6. SQLite is the default local development provider; the home-server deployment uses the separate PostgreSQL schema and migrations. Zod validates action input. Server-side rules remain necessary even where the browser validates a field.')

page('Part C','Data model and persistence')
diagram('domain_relationships.png',[
    (20,20,300,100,'User\nIdentity and role'),(520,20,300,100,'Provider\nOwner userId'),
    (1020,20,350,100,'Product\nProvider and price'),(520,205,300,110,'Order\nCustomer and provider'),
    (1020,205,350,110,'OrderItem\nPrice snapshot'),(520,390,300,100,'Payment and\nOrderEvent'),
],[(320,70,520,70),(820,70,1020,70),(670,120,670,205),(170,120,520,255),
   (820,260,1020,260),(1195,120,1195,205),(670,315,670,390)],510)
para('Figure 2. Principal Sprint 1 relationships. A User can own a Provider and can separately be the customer on an Order. An Order has multiple items, payments and events.')
table(['Entity','Key fields and constraints'],[
    ('User and Session','Unique phone; server-held role. Unique random session token, userId relation, expiresAt; user deletion cascades sessions.'),
    ('OtpCode','Phone, code, attempts, expiry, consumedAt and createdAt. Plaintext test-code storage remains a production-auth limitation.'),
    ('Provider and Product','Unique provider userId; verification status and supported areas. Product has providerId, active flag and integer baht price.'),
    ('Order and OrderItem','Unique order code; customer and provider relations; status and appointment. Items snapshot names and whole-baht prices at creation.'),
    ('ProviderBlockedDate','Unique providerId plus yyyy-mm-dd date; interpretation is Asia/Bangkok.'),
    ('Payment and OrderEvent','Persist financial results and order history. Money-operation journal coordinates duplicate prevention and uncertain outcomes.'),
], [4.5,12.7])
sub('Setup and schema lifecycle',
    'Local setup uses .env.example, Prisma db push and prisma/seed.ts through npm scripts. The assessment must use synthetic seed data only. PostgreSQL has a separate generated schema and versioned migrations; the latest recorded deployment has eight migrations. Do not apply the SQLite development procedure to a live PostgreSQL database.')
sub('Failure and storage boundaries',
    'Confirmation checks and writes occur inside a transaction. Orders and monetary records cannot be inferred from UI state alone. Uploaded files are stored outside disposable application images. Existing integer-baht catalog totals and integer-minor-unit provider settlement snapshots are different representations and must not be mixed.')

section_c_data(page, para, sub, table, code)
page('Part C','Access and delivery design')
table(['Operation','Visitor','Customer','Provider','Admin'],[
    ('Read public catalog','Yes','Yes','Yes','Yes'),
    ('Create installation order','No','Own purchase','Own purchase','Own purchase'),
    ('Read private order','No','Own only','Assigned shop only','Authorized admin'),
    ('Confirm appointment','No','No','Own verified shop only','No normal shop override'),
    ('Update shop profile','No','No provider record','Own provider record','Separate admin workflow'),
    ('Read operations inventory','No','No','No','Yes'),
], [5.2,2,3.3,3.8,2.9])
para('Account policy: any signed-in account may buy for itself. createInstallOrder derives the buyer from the session without requiring CUSTOMER role. Shop management still requires the owning verified provider. Query functions accept trusted identities from their server callers; role selection is never a browser authorization mechanism.')
sub('Identity and session behavior',
    'Login uses a phone challenge in the restricted test environment. Successful consumption establishes a server session with a 32-byte random token encoded as hex and a 30-day expiry. The cookie is HttpOnly, SameSite Lax, path root and Secure in production mode. Current identity is read through the session record; the client does not select its role. Logout deletes the matching session record and cookie. No password hashing is applicable because local passwords are not used.')
sub('Interfaces and safe errors',
    'Server Actions return {ok:true,data:...} or {ok:false,error:string}. Zod validates payloads before mutation. Client forms show field errors, move focus to invalid input and show loading while work is pending. Empty and error states remain distinguishable. Document action contracts as functions; Next.js internal action transport is not a stable invented REST endpoint.')
sub('Deployment and configuration',
    'Current staging uses Docker Compose, PostgreSQL and persistent upload and operations volumes on a private home server. Test credentials and server secrets stay outside Git and the client bundle. The proposed Lab 5 mapping is a containerized application on GCP, a durable PostgreSQL service and object storage for uploads, with a secret store and a worker execution plan. This is a design option, not an implemented or cost-approved GCP deployment. Public SMS, live payments, domain and off-machine backup remain unconfigured or blocked.')

section_c_ui(page, para, sub, table, code)
page('Part D','Three sprint delivery plan')
para('This is the proposed assessment plan over the disclosed existing Saan baseline. It requires agreement with the course theme and reuse rules. Existing features are inspected and verified rather than falsely described as newly written during these sprints.')
table(['Sprint','Goal and features','Dependencies','Completion outcome'],[
    ('1\n8 November','Baseline and useful order journey. F-01 to F-04.','Theme and reuse decision; seed data; mock payment; genuine peer review.','Persisted order, test deposit, appointment confirmation, rejection and access checks; A-F PDF and accepted immutable release.'),
    ('2\n29 November','Expand core service work. F-05 and F-06.','Accepted Sprint 1; prospective feature contracts and state rules.','Quote acceptance, work reporting and communication verified with meaningful domain and ownership tests.'),
    ('3\n13 December','Personal tools, discovery and operational hardening. F-07 to F-09.','Stable core workflow; durable storage design; participant availability.','Private records, public shop projection, inclusive interaction, restore and deployment checks with limitations disclosed.'),
], [2.3,5.1,4.7,5.1])
sub('Feasibility and priorities',
    'Do not expand Sprint 1 to cover the whole marketplace. Prioritize correct identity, one transactional domain path, persistence and credible verification. A working home-server deployment does not replace course-required integration evidence. Lab 5 cloud work must follow its own specification when supplied.')
sub('Proposed ownership',
    'Suwiwat leads application development, integration and technical fixes. Supanut focuses on requirements review, test design, manual execution, reproducible defect reports and substantive peer review. Both agree scope, understand the released behavior and inspect final acceptance. Responsibility is assigned; actual contributions are credited only after the work is performed and recorded.')
sub('Decisions to close',
    'Confirm the assigned theme and original two-person repository requirement; obtain the reuse decision; choose the final release; and select two genuine Issues with substantive teammate reviews. The signed-in buyer policy and practical team allocation are now recorded decisions. Do not amend historical commits to manufacture a compliant process.')

page('Part E','Identity and catalog contracts')
para('Contract version 1, recorded 5 November 2026 after the inspected implementation. F-01 covers FR-01, BR-05 and BR-06. F-02 covers FR-02 and the catalog input to BR-01. These contracts describe current intent and required assessment checks; they are not pre-implementation history.')
sub('F 01 Identity behavior',
    'A seeded user requests a test challenge, submits a six-digit code and receives a session if verification succeeds. The newest challenge is authoritative. A rejected or expired code must not create a session. Logout removes access through that session. Runtime policy restricts staging login to configured synthetic accounts. Real SMS delivery and production enrollment are excluded.')
table(['Interface','Input','Result and failures'],[
    ('requestOtp','{phone:string}','ActionResult with devCode only in restricted test flow; invalid phone, disallowed test account or request limit fails.'),
    ('verifyOtp','{phone:string,code:string}','ActionResult with role and needsName; reject wrong, expired, locked or consumed code.'),
    ('getCurrentUser / logout','Cookie-derived session / no user-selected identity','Current user or null; logout deletes stored token and cookie.'),
], [4.2,4.8,8.2])
para('Data responsibility: OtpCode, User and Session. No new migration is introduced by this report. Existing test-code storage is not production-grade credential handling.')
table(['AC','Acceptance outcome'],[
    ('AC-01','A valid seeded test login establishes the correct server-derived identity.'),
    ('AC-02','Incorrect, expired, replayed and superseded challenges cannot establish identity.'),
    ('AC-03','Logout invalidates the current session; unauthenticated protected access returns no private data.'),
    ('AC-04','Catalog results contain active products from verified shops; detail shows the authoritative product and price.'),
], [1.8,15.4])
sub('F 02 Catalog and UI states',
    'Public browse and product screens show loading, no-match and unavailable-item states. Filters must preserve meaningful selection context. A product that becomes inactive or whose shop loses verification must be rejected at order submission even if an older page remains open. Catalog actions do not accept a client price. CQ-01 and CQ-02 now verify catalog query boundaries; selected UI and submission evidence remains separate.')

page('Part E','Installation order contract')
para('F-03 links FR-03, BR-01, BR-02 and BR-05. Dependencies are F-01, F-02, a verified provider and synthetic local persistence. Version 1 records the inspected baseline, not a new implementation promise.')
sub('Input and application interface',
    'createInstallOrder accepts productId, packageIds, placeType, area, address, preferredDates, optional note and optional geo. It returns ActionResult<{orderId:string}>. User identity is obtained on the server. A successful request creates an INSTALL order, item snapshots and a creation event. The default status is AWAITING_DEPOSIT.')
table(['Field','Boundary'],[
    ('productId and packageIds','Active product under a verified provider; at most 10 packages; deduplicate and require all active packages from that provider.'),
    ('placeType and area','Declared enum values; selected area must belong to provider areas.'),
    ('address and note','Trimmed address 5 to 500 characters; optional note at most 1000.'),
    ('preferredDates','One to three yyyy-mm-dd strings after today in Bangkok; at least one day not blocked by the shop.'),
    ('geo','Optional validated coordinates; if shop pin and radius exist, reject a site outside the radius.'),
], [4.2,13])
sub('Pricing and persistence',
    'The total is the product price plus valid package prices read from the database. The deposit is Math.round(total * DEPOSIT_RATE), currently 0.30. The caller cannot submit its own total. OrderItem stores the name and price snapshots. The creation and nested records are written through Prisma. UI success navigates to the returned order; a reload must retrieve the persisted result.')
table(['AC','Acceptance outcome'],[
    ('AC-05','A valid submission persists one order with correct owner, provider, items, total, deposit and initial event; reload shows the same result.'),
    ('AC-06','Unsupported area, inactive or mixed-shop items, and all-blocked preferred dates are rejected without a new order.'),
    ('AC-07','An unrelated user cannot retrieve the created order’s private details.'),
], [1.8,15.4])
para('HTTP-04/05 verify actual action persistence, server totals and negative cases. The 7 November correction adds HTTP-10/11 for real calendar dates and Bangkok today/tomorrow. HTTP-12 verifies stale product/provider/package eligibility. HTTP-13 confirms sequential repeats create distinct unpaid orders; no create idempotency or universal concurrent locking is promised. See the closing Part F update for the retained failing and passing results.')

section_e_boundaries(page, para, sub, table, code)
page('Part E','Test deposit and confirmation contract')
para('F-04 links FR-04, BR-03 to BR-05, NFR-01 and NFR-02. No live financial contract, regulated holding arrangement or production payout capability is asserted.')
sub('State sequence',
    'Order creation establishes AWAITING_DEPOSIT. A successful verified test deposit changes the order to AWAITING_PROVIDER. Only then may the owning verified shop confirm a future appointment, producing CONFIRMED. Remaining work and completion states are outside this Sprint 1 acceptance boundary.')
table(['Interface','Input and authorization','Mutation or failure'],[
    ('payDeposit','{orderId, method}; session-derived customer identity','Delegate to runCustomerPayment. Repeated pending work resumes rather than duplicating collection.'),
    ('confirmOrder','{orderId, scheduledAt}; ISO datetime with offset; current verified provider','Call confirmProviderOrder using the server-derived provider userId.'),
    ('confirmProviderOrder','Service input includes trusted userId and future Date','Transactional owner/state lock, blocked-day check, confirmation, one event and one notification.'),
], [4,6,7.2])
sub('Failure and concurrency rules',
    'A non-owner, unverified shop, wrong order state, invalid date, past date or blocked Bangkok day cannot confirm. A transaction must roll back all writes on rejection. Repeated confirmation must fail without duplicate events. Confirmation and customer cancellation compete against the same order state; only one successful transition is expected.')
table(['AC','Acceptance outcome'],[
    ('AC-08','A test deposit advances its own order once; a duplicate request does not create duplicate final payment effects.'),
    ('AC-09','An open future date allows the owning verified provider to confirm once with one event and notification.'),
    ('AC-10','A blocked Bangkok date rejects confirmation and preserves prior status, schedule, events and notifications.'),
    ('AC-11','Another user or an unverified owner cannot confirm the order.'),
    ('AC-12','Concurrent confirmation and cancellation produce exactly one accepted state transition.'),
], [1.8,15.4])

page('Part E','Software test specification and done criteria')
table(['Test and AC','Level and setup','Action and expected result'],[
    ('TEST-01 / 01','UI and session; seeded account','Valid login; current-user identity matches seed and persists across reload.'),
    ('TEST-02 / 02','Integration; synthetic OTP rows','Redeem invalid, expired, used and superseded codes; reject without replay.'),
    ('TEST-03 / 03','HTTP and UI; logged-in session','Logout then protected request; no private data and session no longer valid.'),
    ('TEST-04 / 04','Query and UI; mixed catalog fixtures','Browse and attempt stale item submission; only eligible items visible and accepted.'),
    ('TEST-05 / 05','Action/database and UI; valid product','Submit synthetic order then reload; assert owner, snapshots, totals and event.'),
    ('TEST-06 / 06','Action/database; invalid boundaries','Submit unsupported area, mixed items and blocked dates; no new order.'),
    ('TEST-07 / 07','Query and HTTP; two customers','Request another owner’s order; return no private details.'),
    ('TEST-08 / 08','Integration; unpaid owned order','Race duplicate test deposits; one gateway execution and final effect.'),
    ('TEST-09 / 09','Integration; awaiting provider','Confirm twice; one success, persisted time and one event/notification.'),
    ('TEST-10 / 10','Integration; blocked Bangkok day','Confirm; fail with unchanged order and zero new event/notification.'),
    ('TEST-11 / 11','Integration plus action boundary','Use other user or unverified owner; reject and preserve order.'),
    ('TEST-12 / 12','Integration; cancellable paid order','Race confirmation and cancellation; exactly one successful transition.'),
], [3.1,5.1,9])
sub('Product Definition of Done',
    'A feature is done when linked requirements and observable AC are implemented; planned verification has been executed with meaningful assertions; failures and skips are disclosed; genuine teammate review and integration are complete; setup and contracts match the release; and evidence identifies the tested commit. A passing service suite alone does not meet this full definition.')
sub('Contract and TDD history',
    'Preserve the original baseline. For new meaningful rule work, commit its contract and intended failing test before correction, retain the failure, then retain the passing run after the fix. No historical red test or teammate approval is fabricated here. These after-the-fact contracts cannot retrospectively satisfy a before-implementation requirement.')

page('Part F','Implementation and evidence inventory')
para('The inspected baseline is '+sha+'. The report content and its authoring files are later documentation additions. The assessed release remains unselected. The following history is descriptive and is not evidence of course teammate review.')
table(['Commit','Date','Existing change'],[
    ('ecc721a','4 November 2026','Inclusive map and Thai input changes; compatible runtime dependency updates'),
    ('6e39a34','4 November 2026','Public shop photos and contact availability; recorded restore verification'),
    ('e57c5c6','4 November 2026','Narrow calendar touch targets and production authentication plan'),
    ('8492949','4 November 2026','Runtime support readiness inventory and superseded OTP rejection'),
], [2.4,3.6,11.2])
sub('Primary implementation sources',
    'src/server/actions/auth.ts and src/server/auth.ts define challenge/session behavior. src/server/actions/orders.ts defines installation creation. src/server/actions/provider.ts delegates confirmation. src/server/provider-order-service.ts contains the transactional calendar and ownership rule. src/server/payment-service.ts handles customer financial operations. src/server/queries.ts restricts private order projection. prisma/schema.prisma defines the local relational model.')
sub('Historical execution evidence',
    'docs/DEPLOYMENT-STATUS.md records 4 November runs: 65 SQLite integration cases, 55 PostgreSQL-compatible cases, four configuration cases, TypeScript, targeted lint and Linux build passed for the service-preparation release. These are dated operational records, not a fresh execution transcript for the final coursework release. Provider-order and review suites were SQLite-only. Known filesystem tracing warnings and Prisma CLI advisories remain disclosed.')
sub('Required program demonstration set',
    'D-01 requires the complete selected UI journey. Actual HTTP checks now cover creation, mock deposit, confirmation and persisted retrieval; browser excerpts show login and retrieval of the confirmed outcome. D-02 has actual HTTP and database rollback assertions for blocked-date rejection. D-03 has HTTP/session checks and selected browser logout and unrelated-user denial evidence. The excerpts do not claim the entire creation flow was manually executed through the UI.')
sub('Source priority and limitations',
    'Some README implementation descriptions predate the PostgreSQL and sandbox releases. This report uses inspected code and dated deployment records for those details. The master course specification and lecture materials referenced by the teammate’s AI conversation have not been supplied or independently verified.')

page('Part F','Automated results and test excerpts')
if finished:
    para('Fresh local integration verification on 7 November 2026 used npm run test:integration against its isolated SQLite money-test.db. Four coursework query regressions supplement the existing business services. The stylesheet correction and prospective calendar correction are recorded in this part. Retained output: docs/coursework/evidence/integration-date-after-2026-11-07.txt.')
    table(['Tests','Passed','Failed','Skipped'],[[counts[k][-1] for k in ['tests','pass','fail','skipped']]],[4.3]*4)
    code('Command: npm run test:integration\n1..69\n# tests 69    # pass 69\n# fail 0      # skipped 0')
    para('Route type generation and TypeScript passed. Earlier Windows Turbopack attempts failed during font access or worker startup. Direct Webpack compilation exposed an additional stylesheet defect, leading to the prospective correction described in this part. Retained logs distinguish each attempt. The dated Linux build remains historical; a fresh local build is identified by its exact command and CSS acceptance result.')
else:
    para('Fresh local integration verification is not yet recorded as complete. The report must be rebuilt after the command finishes; no fresh passing count is inferred from historical runs.')
sub('Important domain rule excerpt',
    'tests/provider-orders.integration.test.ts, blocked Bangkok date rejects confirmation and rolls back every mutation. Fixture setup creates a verified shop and an AWAITING_PROVIDER order with a synthetic paid deposit. The selected date is 00:30 in Bangkok, still the previous UTC calendar day.')
code('''await db.providerBlockedDate.create({ data: {
  providerId: f.provider.id, date: "2030-01-02"
} });
const result = await confirmProviderOrder(f.input);
assert.equal(result.ok, false);
const unchanged = await db.order.findUniqueOrThrow({
  where: { id: f.order.id }
});
assert.equal(unchanged.status, "AWAITING_PROVIDER");
assert.equal(unchanged.scheduledAt, null);''')
para('The full test also asserts unchanged updatedAt and zero new order events or customer notifications. This supports TEST-10 and NFR-02.')
sub('Ownership restriction excerpt',
    'The same file contains another user and an unverified owner cannot confirm. It uses the customer identity against the provider service, then changes the owning shop to PENDING.')
code('''assert.equal((await confirmProviderOrder({
  ...f.input, userId: f.customer.id
})).ok, false);
await db.provider.update({ where: { id: f.provider.id },
  data: { status: "PENDING" } });
assert.equal((await confirmProviderOrder(f.input)).ok, false);''')
para('The full test asserts AWAITING_PROVIDER and zero events. This is service-level TEST-11 evidence. It does not replace a session-backed action or HTTP authorization test. No red-before-green history is claimed for these existing tests.')

section_f_http(page, para, sub, table, code)
page('Part F','Browser retrieval and styled layout evidence')
para('VIS-01 / AC-01, AC-05 and AC-09. Role: seeded buyer. Starting condition: HTTP-04/07/08 created, mock-paid and confirmed the synthetic order. Steps: sign in through the browser, open own orders and open the saved record. Expected and actual: the confirmed appointment and saved amounts are visible. This is an actual browser retrieval check, not a claim of manual UI order creation.')
evidence_picture('accepted-order-confirmed.png','Synthetic buyer sees the persisted confirmed order and saved totals')
table(['Observed field','Expected and actual'],[
    ('Synthetic order','SN-955842, confirmed appointment on 2 January 2030 at 10:00 Bangkok'),
    ('Amounts','Total THB 1100; paid test deposit THB 330; remaining THB 770'),
    ('Layout','Correctly bounded shared header SVGs, maximum observed width 28 CSS pixels; document width 1265 within viewport 1280'),
], [4.4,12.8])
para('Captured on the corrected local production build from source 846b532, using the isolated HTTP fixture. Screens are Thai because that is the product language. Verification and captions are English. Earlier unstyled images remain diagnostic failures and are excluded from accepted visual evidence. The agent performed these checks; independent student execution remains to be recorded.')

page('Part F','Browser logout and ownership denial evidence')
para('VIS-02 / AC-03: seeded buyer logs out and revisits the protected order URL. Expected and actual: login page with the protected return path; no order details. HTTP-09 additionally proves stored-session deletion and denial of the replayed cookie.')
evidence_picture('accepted-logout-protected.png','Protected order navigation returns to login after browser logout',16.3)
para('VIS-03 / AC-07: unrelated seeded buyer signs in and follows the same private order URL. Expected and actual: unavailable-page state without private address or note. HTTP-06 and CQ-04 provide the backend assertions, so this is more than a hidden button.')
evidence_picture('accepted-unrelated-denied.png','Unrelated signed-in customer cannot view the private order',16.3)
section_f_build(page, para, sub, table, code)
section_f_coverage(page, para, sub, table, code)
page('Part F','Acceptance results and submission handoff')
table(['AC and test','Actual source or check','Evidence status'],[
    ('01 / TEST-01','HTTP-03 and browser seeded login','Server identity verified; complete UI-created journey remains separate'),
    ('02 / TEST-02','OTP integration and HTTP-02','Service cases and no-session-on-invalid-action passed'),
    ('03 / TEST-03','HTTP-01 and HTTP-09; browser logout','Session removal, cookie replay denial and login navigation passed'),
    ('04 / TEST-04','CQ-01 and CQ-02 in coursework-queries.integration.test.ts','Catalog query checks passed; UI coverage pending'),
    ('05 to 07 / TEST-05 to 07','CQ-03/04; HTTP-04/05/06/10/11/12/13','Creation, ownership, calendar rejection, stale eligibility and repeated unpaid creation checked; see current evidence update'),
    ('08 / TEST-08','payments.integration.test.ts duplicate deposits','Passed in the fresh integration run'),
    ('09 to 12 / TEST-09 to 12','Provider service cases and HTTP-06/08','Service rules and authenticated confirmation passed; universal concurrency coverage not claimed'),
], [3.1,6.5,7.6])
sub('Reproduction summary',
    'Use the repository lockfile and supported Node runtime. Install with npm ci, copy .env.example to .env, run npm run db:push and npm run db:seed, then npm run dev. Synthetic local accounts are documented in README; test OTP is shown only in restricted development/test login. Run npx next typegen before npm run typecheck on a clean checkout. Run npm run test:integration and npm run build. Retain actual exit codes and all failures; do not expose environment secrets or use production records.')
sub('Genuine team process still required',
    'Issues 2 to 9 now exist; Supanut posted summaries on 4, 5 and 8. PR 10 publishes the coursework baseline and PR 11 integrates the prospective date correction. These were owner-authorized main integrations, not teammate-approved staging releases. The required two substantive cross-reviewed feature PRs and staging release history must not be inferred from owner merges. Both students must understand the behavior and accept the final release.')
sub('AI use and remaining gates',
    'AI assisted development of the existing Saan application and helped inspect source, structure this report and generate document formatting. The students must independently validate its design, assertions and evidence and disclose actual responsibilities. Before submission, confirm course reuse and theme, complete contribution records, capture the selected program evidence, add genuine process and TDD evidence where applicable, rerun build/tests on the final release and replace this preparation status with actual acceptance results.')
section_f_team(page, para, sub, table, code)
section_f_review(page, para, sub, table, code)

page('Part F','Current verification and integration update')
para('Updated 7 November 2026. Proposed application release: 9377577047bf210c5e72da0cf7fbab5733451fa0. PR 10 merged the coursework baseline (3f536bf); PR 11 merged the calendar correction (9377577). Owner-authorized bypass was used; neither merge is represented as independent teammate approval. Historical screenshots earlier in Part F remain explicitly tied to their 5 November source.')
table(['Evidence','Actual result','Source'],[
    ('Calendar red result','Unchanged createInstallOrder accepted 2030-02-30; regression failed as intended.','Contract/regression a31e791; http-date-before-2026-11-07.json and .txt'),
    ('Calendar green result','Calendar-aware Zod ISO validation rejects impossible dates without order/item/event writes. Valid leap dates and Bangkok tomorrow pass; today rejects.','Correction 1541d24; HTTP-10 and HTTP-11'),
    ('Submission boundaries','Stale product/provider/package reject without writes. Sequential repeats create two distinct unpaid orders with independent snapshots.','HTTP-12 and HTTP-13; no universal concurrent-create claim'),
    ('Automated verification','69 integration tests and 13 session-backed HTTP scenarios passed; zero failures/skips. TypeScript, lint, Webpack build and compiled CSS passed.','integration-date-after-2026-11-07.txt; http-date-after-2026-11-07.json; baseline type/lint logs'),
    ('Build limitation','Fresh default Turbopack failed starting its PostCSS worker. Direct Webpack command passed. No fresh Turbopack pass is claimed.','build-date-after-2026-11-07.txt; RELEASE-STATUS.md'),
], [3.2,8,6])
para('The HTTP report records the contract commit plus hashes of the tested implementation working tree. The correction commit subsequently contains that implementation. The report author verified matching source-file hashes rather than pretending the earlier commit already contained the correction. Tests use new isolated SQLite data, synthetic sessions and mock payment; no home-server deployment or live payment occurred.')
code('node node_modules/next/dist/bin/next build --webpack\nnode docs/coursework/check-css.mjs\nnpm run typecheck\nnpm run lint\nnpm run test:integration\nnode docs/coursework/check-http.mjs\nRESULT 13 passed, 0 failed, 0 skipped')

page('Part F','Received teammate review and remaining acceptance')
para('Supanut submitted the following real GitHub comments. They count as teammate-authored reported findings. PR 14 published the detailed files and nine screenshots. They record AI-assisted execution on 8492949. Supanut published the review package and the personal verification fields remain unrecorded.')
table(['Record','Reported contribution','Inspection status'],[
    ('Issue 4\nikmie','Requirements and traceability review of FR/BR/NFR/AC and signed-in buyer policy; references REQUIREMENTS-FINDINGS.md.','Requirements and defect reports received in PR 14.'),
    ('Issue 5\nikmie','Complete UI-created order journey and negative/usability checks; references TEST-RESULTS.md and nine screenshots.','Test results, nine screenshots and browser telemetry received. The next pages present the selected browser journey and boundary evidence.'),
    ('Issue 8\nikmie','Type generation, typecheck/build, 65 integration and 34 unit tests, equivalent price/ownership checks. Explicitly excludes unpublished coursework correction.','Logs received for 8492949. The later application run records 69 integration and 13 HTTP passes.'),
], [2.7,8.2,6.3])
sub('Remaining acceptance')
para('The browser evidence below is tied to the earlier revision. Final revision browser acceptance remains unrecorded. Record genuine substantive course PR reviews and staging/release history; owner bypass does not substitute for them. Confirm any externally assigned theme/reuse conditions from the real course source, then obtain both students acceptance of the immutable release and this report. The team already confirmed Saan as its product and the practical role allocation; that is not an invented instructor approval.')
sub('Assignment boundary')
para('Docker, CI/CD and public GCP deployment belong to the separate Lab 5 assignment, not this Deliverable 1 acceptance. This update neither deploys infrastructure nor makes the repository public. Keep later cloud requirements, costs and approvals separate from the Sprint 1 report.')

review_screens = ROOT/'docs/coursework/reviews/supanut/screenshots'
for title, captures in [
    ('Browser evidence for checkout and deposit', [
        ('01-customer-order-awaiting-deposit.png', 'E2E-01A. Customer submits the order. The saved total is THB 14,400 and the deposit due is THB 4,320.'),
        ('02-customer-deposit-paid-awaiting-provider.png', 'E2E-01B. The mock deposit is paid and the order awaits the owning provider.')]),
    ('Browser evidence for confirmation and reload', [
        ('03-provider-order-confirmed.png', 'E2E-01C. The owning shop confirms the appointment for 10 November at 09:00 Bangkok time.'),
        ('04-customer-reloaded-confirmed-order.png', 'E2E-01D. The customer reloads the order and sees the persisted confirmation.')]),
    ('Blocked dates and order ownership', [
        ('05-provider-blocked-date-rejection.png', 'E2E-02A/B. The calendar marks blocked days. A separate Server Action probe rejected confirmation with no partial writes.'),
        ('06-ownership-restriction-404.png', 'E2E-03A/B. An unrelated account sees the unavailable order view. The associated action checks report forbidden mutations.')]),
    ('Browser evidence for logout and validation', [
        ('07-logout-protected-redirect.png', 'E2E-04. A fresh protected request after logout redirects to login. The test record reports session deletion.'),
        ('08-usability-validation-focus.png', 'E2E-05A. Incomplete checkout triggers validation and focuses the date field.')]),
    ('Browser evidence for the narrow layout', [
        ('09-usability-narrow-large-text.png', 'E2E-05B. The 360px large-text run reports no horizontal overflow and a 57px date control.')]),
]:
    page('Part F', title)
    para('Source 8492949. AI-assisted browser run on 6 November 2026 with isolated SQLite data and mock payments. Supanut published the evidence in PR 14.')
    for filename, caption in captures:
        screenshot = review_screens/filename
        size = {'height': Cm(14)} if filename.startswith('09-') else {'width': Cm(14.8)}
        DOC.add_picture(str(screenshot), **size)
        DOC.inline_shapes[-1]._inline.docPr.set('descr', caption)
        para(caption)

for row in navigation_table.rows[1:]:
    letter = row.cells[0].text
    matches = [i + 1 for i, (part, _) in enumerate(PAGES) if part == f'Part {letter}']
    row.cells[1].text = f'{min(matches)} to {max(matches)}' if len(matches) > 1 else str(matches[0])

# The python-docx base template can carry a theme-colored Title border.
# Remove paragraph borders from the generated document and all styles.
for root in [DOC._element, DOC.styles.element]:
    for border in list(root.iter(qn('w:pBdr'))):
        border.getparent().remove(border)
DOC.save(OUT/'Saan_CPE334_Deliverable_1.docx')
(OUT/'report-structure.json').write_text(json.dumps({'baseline':sha,'pages':PAGES,'integrationCounts':counts},indent=2),encoding='utf8')
print('Wrote',OUT/'Saan_CPE334_Deliverable_1.docx')
