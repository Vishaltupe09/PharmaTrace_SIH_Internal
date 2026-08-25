// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

/**
 * @title PharmaTrace
 * @dev On-chain batch registration and custody transfer tracking for pharmaceutical supply chain traceability.
 */
contract PharmaTrace is AccessControl, Pausable {
    bytes32 public constant MANUFACTURER_ROLE = keccak256("MANUFACTURER_ROLE");
    bytes32 public constant DISTRIBUTOR_ROLE  = keccak256("DISTRIBUTOR_ROLE");
    bytes32 public constant WHOLESALER_ROLE   = keccak256("WHOLESALER_ROLE");
    bytes32 public constant PHARMACY_ROLE     = keccak256("PHARMACY_ROLE");

    enum Status { CREATED, IN_TRANSIT, RECEIVED, FLAGGED, RECALLED, DISPENSED }

    struct MedicineBatch {
        bytes32 batchId;
        bytes32 metadataHash;
        address manufacturer;
        address currentCustodian;
        Status status;
        uint256 createdAt;
        bool exists;
    }

    mapping(bytes32 => MedicineBatch) public batches;

    event BatchRegistered(bytes32 indexed batchId, address indexed manufacturer, bytes32 metadataHash, uint256 timestamp);
    event CustodyTransferred(bytes32 indexed batchId, address indexed from, address indexed to, uint256 timestamp);
    event ReceiptConfirmed(bytes32 indexed batchId, address indexed by, uint256 timestamp);
    event BatchFlagged(bytes32 indexed batchId, string reason, uint256 timestamp);
    event BatchRecalled(bytes32 indexed batchId, string reason, uint256 timestamp);

    modifier onlyCurrentCustodian(bytes32 batchId) {
        require(batches[batchId].exists, "Batch does not exist");
        require(
            batches[batchId].currentCustodian == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Not current custodian"
        );
        _;
    }

    constructor(address admin) {
        require(admin != address(0), "Zero address for admin");
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
    }

    function registerBatch(bytes32 batchId, bytes32 metadataHash)
        external
        onlyRole(MANUFACTURER_ROLE)
        whenNotPaused
    {
        require(!batches[batchId].exists, "Batch already exists");
        require(metadataHash != bytes32(0), "Invalid hash");
        batches[batchId] = MedicineBatch(
            batchId,
            metadataHash,
            msg.sender,
            msg.sender,
            Status.CREATED,
            block.timestamp,
            true
        );
        emit BatchRegistered(batchId, msg.sender, metadataHash, block.timestamp);
    }

    function transferCustody(bytes32 batchId, address to)
        external
        onlyCurrentCustodian(batchId)
        whenNotPaused
    {
        require(to != address(0), "Zero address");
        require(batches[batchId].status != Status.RECALLED, "Batch recalled");
        address from = batches[batchId].currentCustodian;
        batches[batchId].currentCustodian = to;
        batches[batchId].status = Status.IN_TRANSIT;
        emit CustodyTransferred(batchId, from, to, block.timestamp);
    }

    function confirmReceipt(bytes32 batchId) external whenNotPaused {
        require(batches[batchId].exists, "Batch does not exist");
        require(
            batches[batchId].currentCustodian == msg.sender || hasRole(DEFAULT_ADMIN_ROLE, msg.sender),
            "Not recipient"
        );
        require(batches[batchId].status != Status.RECALLED, "Batch recalled");
        batches[batchId].status = Status.RECEIVED;
        emit ReceiptConfirmed(batchId, msg.sender, block.timestamp);
    }

    function flagBatch(bytes32 batchId, string calldata reason) external whenNotPaused {
        require(batches[batchId].exists, "Batch does not exist");
        batches[batchId].status = Status.FLAGGED;
        emit BatchFlagged(batchId, reason, block.timestamp);
    }

    function recallBatch(bytes32 batchId, string calldata reason)
        external
        onlyRole(DEFAULT_ADMIN_ROLE)
        whenNotPaused
    {
        require(batches[batchId].exists, "Batch does not exist");
        batches[batchId].status = Status.RECALLED;
        emit BatchRecalled(batchId, reason, block.timestamp);
    }

    function getBatch(bytes32 batchId) external view returns (MedicineBatch memory) {
        return batches[batchId];
    }

    function pause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _pause();
    }

    function unpause() external onlyRole(DEFAULT_ADMIN_ROLE) {
        _unpause();
    }
}
