public with sharing class OpportunityListController {
    @AuraEnabled(cacheable=true)
    public static OpportunityResult getOpportunities(
        Integer pageSize,
        Integer pageNumber,
        String sortField,
        String sortDirection
    ) {
        Integer offset = (pageNumber - 1) * pageSize;

        String countQuery = 'SELECT COUNT() FROM Opportunity';
        Integer totalRecords = Database.countQuery(countQuery);

        String query = 'SELECT Id, Name, StageName, Amount, CloseDate, AccountId, Account.Name'
            + ' FROM Opportunity';

        if (String.isNotBlank(sortField)) {
            String safeSortField = String.escapeSingleQuotes(sortField);
            String safeSortDir = (sortDirection == 'desc') ? 'DESC' : 'ASC';
            query += ' ORDER BY ' + safeSortField + ' ' + safeSortDir + ' NULLS LAST';
        } else {
            query += ' ORDER BY CloseDate DESC NULLS LAST';
        }

        query += ' LIMIT :pageSize OFFSET :offset';

        List<Opportunity> records = Database.query(query);

        OpportunityResult result = new OpportunityResult();
        result.records = records;
        result.totalRecords = totalRecords;
        result.pageSize = pageSize;
        result.pageNumber = pageNumber;
        return result;
    }

    @AuraEnabled
    public static List<Opportunity> updateOpportunities(List<Opportunity> opportunities) {
        try {
            update opportunities;
            return opportunities;
        } catch (Exception e) {
            throw new AuraHandledException(e.getMessage());
        }
    }

    public class OpportunityResult {
        @AuraEnabled public List<Opportunity> records;
        @AuraEnabled public Integer totalRecords;
        @AuraEnabled public Integer pageSize;
        @AuraEnabled public Integer pageNumber;
    }
}
