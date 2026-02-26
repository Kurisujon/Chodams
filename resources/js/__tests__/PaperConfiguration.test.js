/**
 * Unit Tests for PaperConfiguration Types and Constants
 * 
 * Tests the paper size definitions, dimensions, and constants
 * to ensure they meet the requirements.
 * 
 * Requirements: 1.1, 1.2, 1.3, 1.4
 */

import { describe, it, expect } from 'vitest';
import { PAPER_SIZES } from '../Services/PaperConfiguration';

describe('PaperConfiguration', () => {
  describe('PAPER_SIZES constant', () => {
    it('should define all three paper formats', () => {
      expect(PAPER_SIZES).toHaveProperty('A4');
      expect(PAPER_SIZES).toHaveProperty('Letter');
      expect(PAPER_SIZES).toHaveProperty('Legal');
    });

    describe('A4 paper format', () => {
      it('should have correct dimensions (210mm × 297mm)', () => {
        expect(PAPER_SIZES.A4.width).toBe(210);
        expect(PAPER_SIZES.A4.height).toBe(297);
      });

      it('should have 20mm margins on all sides', () => {
        expect(PAPER_SIZES.A4.marginTop).toBe(20);
        expect(PAPER_SIZES.A4.marginRight).toBe(20);
        expect(PAPER_SIZES.A4.marginBottom).toBe(20);
        expect(PAPER_SIZES.A4.marginLeft).toBe(20);
      });

      it('should have all required dimension properties', () => {
        expect(PAPER_SIZES.A4).toHaveProperty('width');
        expect(PAPER_SIZES.A4).toHaveProperty('height');
        expect(PAPER_SIZES.A4).toHaveProperty('marginTop');
        expect(PAPER_SIZES.A4).toHaveProperty('marginRight');
        expect(PAPER_SIZES.A4).toHaveProperty('marginBottom');
        expect(PAPER_SIZES.A4).toHaveProperty('marginLeft');
      });
    });

    describe('Letter paper format', () => {
      it('should have correct dimensions (8.5in × 11in = 215.9mm × 279.4mm)', () => {
        expect(PAPER_SIZES.Letter.width).toBe(215.9);
        expect(PAPER_SIZES.Letter.height).toBe(279.4);
      });

      it('should have 0.75in (19.05mm) margins on all sides', () => {
        expect(PAPER_SIZES.Letter.marginTop).toBe(19.05);
        expect(PAPER_SIZES.Letter.marginRight).toBe(19.05);
        expect(PAPER_SIZES.Letter.marginBottom).toBe(19.05);
        expect(PAPER_SIZES.Letter.marginLeft).toBe(19.05);
      });

      it('should have all required dimension properties', () => {
        expect(PAPER_SIZES.Letter).toHaveProperty('width');
        expect(PAPER_SIZES.Letter).toHaveProperty('height');
        expect(PAPER_SIZES.Letter).toHaveProperty('marginTop');
        expect(PAPER_SIZES.Letter).toHaveProperty('marginRight');
        expect(PAPER_SIZES.Letter).toHaveProperty('marginBottom');
        expect(PAPER_SIZES.Letter).toHaveProperty('marginLeft');
      });
    });

    describe('Legal paper format', () => {
      it('should have correct dimensions (8.5in × 14in = 215.9mm × 355.6mm)', () => {
        expect(PAPER_SIZES.Legal.width).toBe(215.9);
        expect(PAPER_SIZES.Legal.height).toBe(355.6);
      });

      it('should have 0.75in (19.05mm) margins on all sides', () => {
        expect(PAPER_SIZES.Legal.marginTop).toBe(19.05);
        expect(PAPER_SIZES.Legal.marginRight).toBe(19.05);
        expect(PAPER_SIZES.Legal.marginBottom).toBe(19.05);
        expect(PAPER_SIZES.Legal.marginLeft).toBe(19.05);
      });

      it('should have all required dimension properties', () => {
        expect(PAPER_SIZES.Legal).toHaveProperty('width');
        expect(PAPER_SIZES.Legal).toHaveProperty('height');
        expect(PAPER_SIZES.Legal).toHaveProperty('marginTop');
        expect(PAPER_SIZES.Legal).toHaveProperty('marginRight');
        expect(PAPER_SIZES.Legal).toHaveProperty('marginBottom');
        expect(PAPER_SIZES.Legal).toHaveProperty('marginLeft');
      });
    });

    describe('Paper size relationships', () => {
      it('should have Letter and Legal with same width', () => {
        expect(PAPER_SIZES.Letter.width).toBe(PAPER_SIZES.Legal.width);
      });

      it('should have Legal taller than Letter', () => {
        expect(PAPER_SIZES.Legal.height).toBeGreaterThan(PAPER_SIZES.Letter.height);
      });

      it('should have A4 narrower than Letter/Legal', () => {
        expect(PAPER_SIZES.A4.width).toBeLessThan(PAPER_SIZES.Letter.width);
        expect(PAPER_SIZES.A4.width).toBeLessThan(PAPER_SIZES.Legal.width);
      });

      it('should have A4 taller than Letter but shorter than Legal', () => {
        expect(PAPER_SIZES.A4.height).toBeGreaterThan(PAPER_SIZES.Letter.height);
        expect(PAPER_SIZES.A4.height).toBeLessThan(PAPER_SIZES.Legal.height);
      });
    });

    describe('Margin consistency', () => {
      it('should have A4 with uniform margins', () => {
        const { marginTop, marginRight, marginBottom, marginLeft } = PAPER_SIZES.A4;
        expect(marginTop).toBe(marginRight);
        expect(marginRight).toBe(marginBottom);
        expect(marginBottom).toBe(marginLeft);
      });

      it('should have Letter with uniform margins', () => {
        const { marginTop, marginRight, marginBottom, marginLeft } = PAPER_SIZES.Letter;
        expect(marginTop).toBe(marginRight);
        expect(marginRight).toBe(marginBottom);
        expect(marginBottom).toBe(marginLeft);
      });

      it('should have Legal with uniform margins', () => {
        const { marginTop, marginRight, marginBottom, marginLeft } = PAPER_SIZES.Legal;
        expect(marginTop).toBe(marginRight);
        expect(marginRight).toBe(marginBottom);
        expect(marginBottom).toBe(marginLeft);
      });

      it('should have Letter and Legal with same margins', () => {
        expect(PAPER_SIZES.Letter.marginTop).toBe(PAPER_SIZES.Legal.marginTop);
        expect(PAPER_SIZES.Letter.marginRight).toBe(PAPER_SIZES.Legal.marginRight);
        expect(PAPER_SIZES.Letter.marginBottom).toBe(PAPER_SIZES.Legal.marginBottom);
        expect(PAPER_SIZES.Letter.marginLeft).toBe(PAPER_SIZES.Legal.marginLeft);
      });
    });

    describe('Printable area calculations', () => {
      it('should have A4 printable width of 170mm (210 - 20 - 20)', () => {
        const printableWidth = PAPER_SIZES.A4.width - PAPER_SIZES.A4.marginLeft - PAPER_SIZES.A4.marginRight;
        expect(printableWidth).toBe(170);
      });

      it('should have A4 printable height of 257mm (297 - 20 - 20)', () => {
        const printableHeight = PAPER_SIZES.A4.height - PAPER_SIZES.A4.marginTop - PAPER_SIZES.A4.marginBottom;
        expect(printableHeight).toBe(257);
      });

      it('should have Letter printable width of 177.8mm (215.9 - 19.05 - 19.05)', () => {
        const printableWidth = PAPER_SIZES.Letter.width - PAPER_SIZES.Letter.marginLeft - PAPER_SIZES.Letter.marginRight;
        expect(printableWidth).toBeCloseTo(177.8, 1);
      });

      it('should have Letter printable height of 241.3mm (279.4 - 19.05 - 19.05)', () => {
        const printableHeight = PAPER_SIZES.Letter.height - PAPER_SIZES.Letter.marginTop - PAPER_SIZES.Letter.marginBottom;
        expect(printableHeight).toBeCloseTo(241.3, 1);
      });

      it('should have Legal printable width of 177.8mm (215.9 - 19.05 - 19.05)', () => {
        const printableWidth = PAPER_SIZES.Legal.width - PAPER_SIZES.Legal.marginLeft - PAPER_SIZES.Legal.marginRight;
        expect(printableWidth).toBeCloseTo(177.8, 1);
      });

      it('should have Legal printable height of 317.5mm (355.6 - 19.05 - 19.05)', () => {
        const printableHeight = PAPER_SIZES.Legal.height - PAPER_SIZES.Legal.marginTop - PAPER_SIZES.Legal.marginBottom;
        expect(printableHeight).toBeCloseTo(317.5, 1);
      });
    });

    describe('Value types', () => {
      it('should have all dimensions as numbers', () => {
        Object.values(PAPER_SIZES).forEach(paperSize => {
          expect(typeof paperSize.width).toBe('number');
          expect(typeof paperSize.height).toBe('number');
          expect(typeof paperSize.marginTop).toBe('number');
          expect(typeof paperSize.marginRight).toBe('number');
          expect(typeof paperSize.marginBottom).toBe('number');
          expect(typeof paperSize.marginLeft).toBe('number');
        });
      });

      it('should have all dimensions as positive numbers', () => {
        Object.values(PAPER_SIZES).forEach(paperSize => {
          expect(paperSize.width).toBeGreaterThan(0);
          expect(paperSize.height).toBeGreaterThan(0);
          expect(paperSize.marginTop).toBeGreaterThan(0);
          expect(paperSize.marginRight).toBeGreaterThan(0);
          expect(paperSize.marginBottom).toBeGreaterThan(0);
          expect(paperSize.marginLeft).toBeGreaterThan(0);
        });
      });

      it('should have margins smaller than paper dimensions', () => {
        Object.values(PAPER_SIZES).forEach(paperSize => {
          expect(paperSize.marginLeft + paperSize.marginRight).toBeLessThan(paperSize.width);
          expect(paperSize.marginTop + paperSize.marginBottom).toBeLessThan(paperSize.height);
        });
      });
    });
  });
});
