package com.pharmacy.exception;

public class InsufficientStockException extends RuntimeException {
    public InsufficientStockException(String message) {
        super(message);
    }

    public InsufficientStockException(String medicineName, int requested, int available) {
        super(String.format("Insufficient stock for '%s': requested %d, available %d", medicineName, requested, available));
    }
}
