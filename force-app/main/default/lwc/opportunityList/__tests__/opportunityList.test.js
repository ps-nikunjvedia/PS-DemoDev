import { createElement } from "lwc";
import OpportunityList from "c/opportunityList";
import getOpportunities from "@salesforce/apex/OpportunityListController.getOpportunities";

// Mock Apex wire adapter
jest.mock(
    "@salesforce/apex/OpportunityListController.getOpportunities",
    () => ({ default: jest.fn() }),
    { virtual: true }
);

jest.mock(
    "@salesforce/apex/OpportunityListController.updateOpportunities",
    () => ({ default: jest.fn() }),
    { virtual: true }
);

const MOCK_OPPORTUNITIES = {
    records: [
        {
            Id: "006000000000001",
            Name: "Test Opp Won",
            StageName: "Closed Won",
            Amount: 50000,
            CloseDate: "2026-01-15",
            Account: { Name: "Acme Corp" }
        },
        {
            Id: "006000000000002",
            Name: "Test Opp Lost",
            StageName: "Closed Lost",
            Amount: 30000,
            CloseDate: "2026-02-01",
            Account: { Name: "Beta Inc" }
        },
        {
            Id: "006000000000003",
            Name: "Test Opp Open",
            StageName: "Prospecting",
            Amount: 10000,
            CloseDate: "2026-03-01",
            Account: { Name: "Gamma LLC" }
        }
    ],
    totalRecords: 3,
    pageSize: 5,
    pageNumber: 1
};

describe("c-opportunity-list", () => {
    afterEach(() => {
        while (document.body.firstChild) {
            document.body.removeChild(document.body.firstChild);
        }
        jest.clearAllMocks();
    });

    it("renders the component with lightning card", () => {
        getOpportunities.mockResolvedValue(MOCK_OPPORTUNITIES);

        const element = createElement("c-opportunity-list", {
            is: OpportunityList
        });
        document.body.appendChild(element);

        const card = element.shadowRoot.querySelector("lightning-card");
        expect(card).not.toBeNull();
        expect(card.title).toBe("Opportunities");
    });

    it("loads and displays opportunity records", async () => {
        getOpportunities.mockResolvedValue(MOCK_OPPORTUNITIES);

        const element = createElement("c-opportunity-list", {
            is: OpportunityList
        });
        document.body.appendChild(element);

        // Wait for async operations
        await Promise.resolve();
        await Promise.resolve();

        const rows = element.shadowRoot.querySelectorAll("tbody tr");
        expect(rows.length).toBe(3);
    });

    it("displays green flag for Closed Won opportunities", async () => {
        getOpportunities.mockResolvedValue(MOCK_OPPORTUNITIES);

        const element = createElement("c-opportunity-list", {
            is: OpportunityList
        });
        document.body.appendChild(element);

        await Promise.resolve();
        await Promise.resolve();

        const greenFlags =
            element.shadowRoot.querySelectorAll(".flag-green");
        expect(greenFlags.length).toBe(1);
    });

    it("displays red flag for Closed Lost opportunities", async () => {
        getOpportunities.mockResolvedValue(MOCK_OPPORTUNITIES);

        const element = createElement("c-opportunity-list", {
            is: OpportunityList
        });
        document.body.appendChild(element);

        await Promise.resolve();
        await Promise.resolve();

        const redFlags = element.shadowRoot.querySelectorAll(".flag-red");
        expect(redFlags.length).toBe(1);
    });

    it("displays pagination controls", async () => {
        getOpportunities.mockResolvedValue(MOCK_OPPORTUNITIES);

        const element = createElement("c-opportunity-list", {
            is: OpportunityList
        });
        document.body.appendChild(element);

        await Promise.resolve();
        await Promise.resolve();

        const pageSizeCombo = element.shadowRoot.querySelector(
            ".page-size-select"
        );
        expect(pageSizeCombo).not.toBeNull();
    });

    it("shows no records message when empty", async () => {
        getOpportunities.mockResolvedValue({
            records: [],
            totalRecords: 0,
            pageSize: 5,
            pageNumber: 1
        });

        const element = createElement("c-opportunity-list", {
            is: OpportunityList
        });
        document.body.appendChild(element);

        await Promise.resolve();
        await Promise.resolve();

        const emptyMessage = element.shadowRoot.querySelector(
            "tbody td[colspan]"
        );
        expect(emptyMessage).not.toBeNull();
        expect(emptyMessage.textContent).toContain("No opportunities found");
    });

    it("displays error when apex call fails", async () => {
        getOpportunities.mockRejectedValue({
            body: { message: "Test error" }
        });

        const element = createElement("c-opportunity-list", {
            is: OpportunityList
        });
        document.body.appendChild(element);

        await Promise.resolve();
        await Promise.resolve();

        const errorDiv = element.shadowRoot.querySelector(
            ".slds-text-color_error"
        );
        expect(errorDiv).not.toBeNull();
        expect(errorDiv.textContent).toBe("Test error");
    });
});
