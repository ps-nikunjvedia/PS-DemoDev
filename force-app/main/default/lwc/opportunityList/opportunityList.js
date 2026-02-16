import { LightningElement, track } from "lwc";
import getOpportunities from "@salesforce/apex/OpportunityListController.getOpportunities";
import updateOpportunities from "@salesforce/apex/OpportunityListController.updateOpportunities";
import { ShowToastEvent } from "lightning/platformShowToastEvent";

const STAGE_OPTIONS = [
    { label: "Prospecting", value: "Prospecting" },
    { label: "Qualification", value: "Qualification" },
    { label: "Needs Analysis", value: "Needs Analysis" },
    { label: "Value Proposition", value: "Value Proposition" },
    { label: "Id. Decision Makers", value: "Id. Decision Makers" },
    { label: "Perception Analysis", value: "Perception Analysis" },
    { label: "Proposal/Price Quote", value: "Proposal/Price Quote" },
    { label: "Negotiation/Review", value: "Negotiation/Review" },
    { label: "Closed Won", value: "Closed Won" },
    { label: "Closed Lost", value: "Closed Lost" }
];

export default class OpportunityList extends LightningElement {
    @track records = [];
    @track draftValues = {};
    @track editingRows = new Set();
    @track selectedRows = new Set();
    totalRecords = 0;
    pageNumber = 1;
    pageSize = 5;
    sortField = "CloseDate";
    sortDirection = "desc";
    isLoading = true;
    error;

    stageOptions = STAGE_OPTIONS;

    get pageSizeStr() {
        return String(this.pageSize);
    }

    get pageSizeOptions() {
        return [
            { label: "5", value: "5" },
            { label: "10", value: "10" },
            { label: "15", value: "15" },
            { label: "20", value: "20" },
            { label: "25", value: "25" }
        ];
    }

    get columns() {
        return [
            {
                label: "Opportunity Name",
                fieldName: "Name",
                isSorted: this.sortField === "Name",
                sortIcon:
                    this.sortField === "Name" && this.sortDirection === "asc"
                        ? "utility:arrowup"
                        : "utility:arrowdown"
            },
            {
                label: "Stage",
                fieldName: "StageName",
                isSorted: this.sortField === "StageName",
                sortIcon:
                    this.sortField === "StageName" &&
                    this.sortDirection === "asc"
                        ? "utility:arrowup"
                        : "utility:arrowdown"
            },
            {
                label: "Amount",
                fieldName: "Amount",
                isSorted: this.sortField === "Amount",
                sortIcon:
                    this.sortField === "Amount" && this.sortDirection === "asc"
                        ? "utility:arrowup"
                        : "utility:arrowdown"
            },
            {
                label: "Close Date",
                fieldName: "CloseDate",
                isSorted: this.sortField === "CloseDate",
                sortIcon:
                    this.sortField === "CloseDate" &&
                    this.sortDirection === "asc"
                        ? "utility:arrowup"
                        : "utility:arrowdown"
            },
            {
                label: "Account Name",
                fieldName: "AccountName",
                isSorted: this.sortField === "Account.Name",
                sortIcon:
                    this.sortField === "Account.Name" &&
                    this.sortDirection === "asc"
                        ? "utility:arrowup"
                        : "utility:arrowdown"
            }
        ];
    }

    get displayRecords() {
        return this.records.map((rec) => {
            const draft = this.draftValues[rec.Id] || {};
            const merged = { ...rec, ...draft };
            const isEditing = this.editingRows.has(rec.Id);
            const isSelected = this.selectedRows.has(rec.Id);
            const isDraft = Object.prototype.hasOwnProperty.call(
                this.draftValues,
                rec.Id
            );

            return {
                ...merged,
                AccountName: rec.Account ? rec.Account.Name : "",
                isClosedWon: merged.StageName === "Closed Won",
                isClosedLost: merged.StageName === "Closed Lost",
                formattedAmount:
                    merged.Amount != null
                        ? new Intl.NumberFormat("en-US", {
                              style: "currency",
                              currency: "USD"
                          }).format(merged.Amount)
                        : "",
                isSelected,
                editingName: isEditing,
                editingStage: isEditing,
                editingAmount: isEditing,
                editingCloseDate: isEditing,
                rowClass:
                    "slds-hint-parent" +
                    (isDraft ? " slds-is-edited" : "") +
                    (isSelected ? " slds-is-selected" : "")
            };
        });
    }

    get hasRecords() {
        return this.records && this.records.length > 0;
    }

    get totalPages() {
        return Math.max(1, Math.ceil(this.totalRecords / this.pageSize));
    }

    get isPrevDisabled() {
        return this.pageNumber <= 1;
    }

    get isNextDisabled() {
        return this.pageNumber >= this.totalPages;
    }

    get recordRangeStart() {
        if (this.totalRecords === 0) return 0;
        return (this.pageNumber - 1) * this.pageSize + 1;
    }

    get recordRangeEnd() {
        const end = this.pageNumber * this.pageSize;
        return end > this.totalRecords ? this.totalRecords : end;
    }

    get hasUnsavedChanges() {
        return Object.keys(this.draftValues).length > 0;
    }

    get draftCount() {
        return Object.keys(this.draftValues).length;
    }

    get draftLabel() {
        return this.draftCount === 1 ? "change" : "changes";
    }

    get allSelected() {
        return (
            this.records.length > 0 &&
            this.records.every((r) => this.selectedRows.has(r.Id))
        );
    }

    connectedCallback() {
        this.loadData();
    }

    loadData() {
        this.isLoading = true;
        this.error = undefined;

        getOpportunities({
            pageSize: this.pageSize,
            pageNumber: this.pageNumber,
            sortField: this.sortField,
            sortDirection: this.sortDirection
        })
            .then((result) => {
                this.records = result.records;
                this.totalRecords = result.totalRecords;
                this.isLoading = false;
            })
            .catch((err) => {
                this.error = err.body ? err.body.message : err.message;
                this.records = [];
                this.isLoading = false;
            });
    }

    handleSort(event) {
        const field = event.currentTarget.dataset.field;
        if (this.sortField === field) {
            this.sortDirection =
                this.sortDirection === "asc" ? "desc" : "asc";
        } else {
            this.sortField = field;
            this.sortDirection = "asc";
        }
        this.pageNumber = 1;
        this.loadData();
    }

    handlePageSizeChange(event) {
        this.pageSize = parseInt(event.detail.value, 10);
        this.pageNumber = 1;
        this.loadData();
    }

    handlePrevious() {
        if (this.pageNumber > 1) {
            this.pageNumber -= 1;
            this.loadData();
        }
    }

    handleNext() {
        if (this.pageNumber < this.totalPages) {
            this.pageNumber += 1;
            this.loadData();
        }
    }

    handleEditRow(event) {
        const recordId = event.currentTarget.dataset.id;
        if (this.editingRows.has(recordId)) {
            this.editingRows = new Set(
                [...this.editingRows].filter((id) => id !== recordId)
            );
        } else {
            this.editingRows = new Set([...this.editingRows, recordId]);
        }
    }

    handleRowSelect(event) {
        const recordId = event.currentTarget.dataset.id;
        const isChecked = event.target.checked;
        const updated = new Set(this.selectedRows);

        if (isChecked) {
            updated.add(recordId);
        } else {
            updated.delete(recordId);
        }
        this.selectedRows = updated;
    }

    handleSelectAll(event) {
        const isChecked = event.target.checked;
        if (isChecked) {
            this.selectedRows = new Set(this.records.map((r) => r.Id));
        } else {
            this.selectedRows = new Set();
        }
    }

    handleFieldChange(event) {
        const recordId = event.currentTarget.dataset.id;
        const field = event.currentTarget.dataset.field;
        const value = event.detail.value;

        const existingDraft = this.draftValues[recordId] || {};
        this.draftValues = {
            ...this.draftValues,
            [recordId]: {
                ...existingDraft,
                [field]: value
            }
        };
    }

    handleSave() {
        const recordsToUpdate = Object.keys(this.draftValues).map((id) => ({
            Id: id,
            ...this.draftValues[id]
        }));

        if (recordsToUpdate.length === 0) return;

        this.isLoading = true;

        updateOpportunities({ opportunities: recordsToUpdate })
            .then(() => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: "Success",
                        message: `${recordsToUpdate.length} record(s) updated successfully.`,
                        variant: "success"
                    })
                );
                this.draftValues = {};
                this.editingRows = new Set();
                this.selectedRows = new Set();
                this.loadData();
            })
            .catch((err) => {
                this.dispatchEvent(
                    new ShowToastEvent({
                        title: "Error",
                        message: err.body ? err.body.message : err.message,
                        variant: "error"
                    })
                );
                this.isLoading = false;
            });
    }

    handleCancelEdit() {
        this.draftValues = {};
        this.editingRows = new Set();
        this.selectedRows = new Set();
    }
}
