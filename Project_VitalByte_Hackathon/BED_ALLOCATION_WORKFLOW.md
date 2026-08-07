# Hospital Bed Allocation Workflow Design

## 1. Overview
This system governs how hospital beds are managed, ensuring optimal utilization, patient safety, and auditable history. It connects **Admins** (Configuration), **Nurses** (Execution), and **Doctors** (Clinical Authority).

## 2. Methodology & Architecture
The workflow follows a **Rules-Based Assignment with Clinical Override** model.
- **Single Source of Truth**: A centralized Bed Registry (`allBeds` in Database/Context).
- **State Machine**: Beds transition between states (`Available`, `Cleaning`, `Occupied`, `Maintenance`).
- **Priority Queue**: ICU/Emergency requests bypass standard FIFO queues.

---

## 3. Workflow by Role

### A. Admin (Configuration & Audit)
*   **Responsibility**: Define the "Physics" of the hospital.
*   **Actions**:
    1.  **Ward Configuration**: Define Wards (ICU, General, Private), capacity, and gender constraints.
    2.  **Protocol Definition**: Map clinical conditions to default Wards (e.g., *Head Injury* -> *ICU*).
    3.  **Audit**: View full history of who moved whom and when.

### B. Nurse (Operational Execution)
*   **Responsibility**: The logistical movement of patients.
*   **Actions**:
    1.  **Admit Patient**: Select a `REGISTERED` patient. System highlights recommended beds based on Admin Protocols. Nurse selects specific Bed # (e.g., "Bed 104-A").
    2.  **Transfer**: Move patient between beds (e.g., General -> ICU) upon Doctor's order.
    3.  **Discharge Ops**: Mark patient as `DISCHARGED`, setting bed status to `CLEANING`.

### C. Doctor (Clinical Authority)
*   **Responsibility**: Authorization and Triage.
*   **Actions**:
    1.  **Bed Orders**: Create "Admission Orders" or "Transfer Orders" (e.g., "Upgrade to Private Ward").
    2.  **Approve Discharges**: Clinical clearance required before Nurse can release the bed.
    3.  **Override**: Force-assign specific beds for medical reasons (Isolation, Proximity to Nurse Station).

---

## 4. Technical Implementation

### Data Structures (Schema)

**1. Bed Entity**
```json
{
  "bedId": "WARD-A-101",
  "wardId": "WARD-A",
  "type": "ICU",
  "status": "OCCUPIED" | "AVAILABLE" | "CLEANING" | "MAINTENANCE",
  "currentPatientId": "PAT-12345",
  "features": ["Oxygen", "Ventilator"],
  "lastCleaned": "TIMESTAMP"
}
```

**2. Allocation Rule**
```json
{
  "condition": "Cardiac Arrest",
  "recommendedWard": "ICU",
  "priority": "CRITICAL"
}
```

**3. Allocation Log (History)**
```json
{
  "logId": "LOG-001",
  "patientId": "PAT-12345",
  "bedId": "WARD-A-101",
  "action": "ADMIT" | "TRANSFER" | "DISCHARGE",
  "actorId": "NURSE-JANE",
  "timestamp": "ISO-DATE",
  "reason": "Initial Admission"
}
```

### Real-Time Logic
1.  **Auto-Recommendation**: On Bed Selection screen, filter beds by:
    *   Bed Type vs. Patient Condition
    *   Gender (if Ward is gender-segregated)
    *   Availability
2.  **Conflict Resolution**: If two nurses try to grab the same bed, Database Optimistic Locking prevents double-booking.

---

## 5. Critical Workflows (Step-by-Step)

### Scenario A: Emergency Admission (Red Code)
1.  **Trigger**: Front Desk registers "Trauma" patient.
2.  **System**: Auto-tags as `CRITICAL`.
3.  **Nurse View**:
    *   System flashes "Trauma Bed Recommended".
    *   Nurse clicks "Quick Assign" on nearest available ER bed.
    *   Bed status -> `OCCUPIED`.

### Scenario B: Standard Ward Upgradation
1.  **Doctor**: Order "Transfer to Private Room" (Status: `PENDING_TRANSFER`).
2.  **Nurse**:
    *   Sees Alert: "Transfer Requested".
    *   Views available Private Rooms.
    *   Selects "Room 502".
    *   Confirms Move.
3.  **System**:
    *   Old Bed (General) -> `CLEANING`.
    *   New Bed (Private) -> `OCCUPIED`.
    *   Log entry created.

### Scenario C: Discharge
1.  **Doctor**: Marks `Ready for Discharge`.
2.  **Nurse**:
    *   Completes paperwork.
    *   Clicks "Release Bed".
3.  **System**:
    *   Bed -> `CLEANING`.
    *   Patient -> `DISCHARGED`.
