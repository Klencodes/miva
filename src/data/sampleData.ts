
import { Roles } from '../core/enums/roles';
import { InventoryItem, Invoice, InvoiceItem, IUser, SystemSettings } from '../core/types';

// Generate all inventory items from the price list
export const generateInitialInventory = (): InventoryItem[] => {
  const items: InventoryItem[] = [];
  let id = 1;

  const addItem = (
    name: string,
    type: InventoryItem['type'],
    unit: InventoryItem['unit'],
    price: number,
    specs: Partial<InventoryItem['specs']> = {},
    quantity: number = Math.floor(Math.random() * 100) + 20,
    cost: number = price * 0.6,
    supplier: string = 'MIVA-CRIMP JV'
  ) => {
    items.push({
      id: `item-${id++}`,
      name,
      type,
      unit,
      quantity,
      specs: {
        partNumber: specs.partNumber,
        sae: specs.sae,
        pressure: specs.pressure,
        threadType: specs.threadType,
        diameter: specs.diameter,
        material: specs.material,
        angle: specs.angle,
        ...specs
      },
      reorderThreshold: 10,
      cost,
      price,
      location: `Aisle ${Math.floor(Math.random() * 5) + 1}, Rack ${Math.floor(Math.random() * 4) + 1}`,
      supplier,
      lastUpdated: new Date()
    });
  };

  // ===== TWO WIRE HOSES =====
  addItem('R2T-03 3/16" HYDRAULIC BRAIDED HOSE', 'hose', 'meters', 0.70, { partNumber: 'R2T-03', sae: '100R2', pressure: 350 });
  addItem('R2T-04 1/4" HYDRAULIC BRAIDED HOSE', 'hose', 'meters', 0.70, { partNumber: 'R2T-04', sae: '100R2', pressure: 350 });
  addItem('R2T-05 5/16" HYDRAULIC BRAIDED HOSE', 'hose', 'meters', 0.80, { partNumber: 'R2T-05', sae: '100R2', pressure: 350 });
  addItem('R2T-06 3/8" HYDRAULIC BRAIDED HOSE', 'hose', 'meters', 0.80, { partNumber: 'R2T-06', sae: '100R2', pressure: 350 });
  addItem('R2T-08 1/2" HYDRAULIC BRAIDED HOSE', 'hose', 'meters', 0.90, { partNumber: 'R2T-08', sae: '100R2', pressure: 350 });
  addItem('R2T-10 5/8" HYDRAULIC BRAIDED HOSE', 'hose', 'meters', 1.10, { partNumber: 'R2T-10', sae: '100R2', pressure: 350 });
  addItem('R2T-12 3/4" HYDRAULIC BRAIDED HOSE', 'hose', 'meters', 1.30, { partNumber: 'R2T-12', sae: '100R2', pressure: 350 });
  addItem('R2T-16 1" HYDRAULIC BRAIDED HOSE', 'hose', 'meters', 1.80, { partNumber: 'R2T-16', sae: '100R2', pressure: 350 });
  addItem('R2T-20 1 1/4" HYDRAULIC BRAIDED HOSE', 'hose', 'meters', 2.40, { partNumber: 'R2T-20', sae: '100R2', pressure: 350 });
  addItem('R2T-24 1 1/2" HYDRAULIC BRAIDED HOSE', 'hose', 'meters', 2.70, { partNumber: 'R2T-24', sae: '100R2', pressure: 350 });
  addItem('R2T-32 2" HYDRAULIC BRAIDED HOSE', 'hose', 'meters', 3.30, { partNumber: 'R2T-32', sae: '100R2', pressure: 350 });

  // ===== PTFE TEFLON HOSES =====
  addItem('PTFE-06 3/8" PTFE TEFLON BRAIDED HOSE', 'hose', 'meters', 1.20, { partNumber: 'PTFE-06', sae: 'PTFE', material: 'Teflon' });
  addItem('PTFE-08 1/2" PTFE TEFLON BRAIDED HOSE', 'hose', 'meters', 1.30, { partNumber: 'PTFE-08', sae: 'PTFE', material: 'Teflon' });
  addItem('PTFE-10 5/8" PTFE TEFLON BRAIDED HOSE', 'hose', 'meters', 1.60, { partNumber: 'PTFE-10', sae: 'PTFE', material: 'Teflon' });
  addItem('PTFE-12 3/4" PTFE TEFLON BRAIDED HOSE', 'hose', 'meters', 1.70, { partNumber: 'PTFE-12', sae: 'PTFE', material: 'Teflon' });
  addItem('PTFE-16 1" PTFE TEFLON BRAIDED HOSE', 'hose', 'meters', 2.30, { partNumber: 'PTFE-16', sae: 'PTFE', material: 'Teflon' });

  // ===== 4SP/4SH MULTI SPIRAL HOSES =====
  addItem('4SH-06 3/8" HYDRAULIC MULTI SPIRAL HOSE', 'hose', 'meters', 1.20, { partNumber: '4SH-06', sae: '4SH', pressure: 350 });
  addItem('4SH-08 1/2" HYDRAULIC MULTI SPIRAL HOSE', 'hose', 'meters', 1.30, { partNumber: '4SH-08', sae: '4SH', pressure: 350 });
  addItem('4SH-10 5/8" HYDRAULIC MULTI SPIRAL HOSE', 'hose', 'meters', 1.60, { partNumber: '4SH-10', sae: '4SH', pressure: 350 });
  addItem('4SH-12 3/4" HYDRAULIC MULTI SPIRAL HOSE', 'hose', 'meters', 1.70, { partNumber: '4SH-12', sae: '4SH', pressure: 350 });
  addItem('4SH-16 1" HYDRAULIC MULTI SPIRAL HOSE', 'hose', 'meters', 2.40, { partNumber: '4SH-16', sae: '4SH', pressure: 350 });
  addItem('4SH-20 1 1/4" HYDRAULIC MULTI SPIRAL HOSE', 'hose', 'meters', 3.20, { partNumber: '4SH-20', sae: '4SH', pressure: 350 });
  addItem('4SH-24 1 1/2" HYDRAULIC MULTI SPIRAL HOSE', 'hose', 'meters', 3.60, { partNumber: '4SH-24', sae: '4SH', pressure: 350 });
  addItem('4SH-32 2" HYDRAULIC MULTI SPIRAL HOSE', 'hose', 'meters', 4.00, { partNumber: '4SH-32', sae: '4SH', pressure: 350 });

  // ===== SIX WIRE MULTI SPIRAL HOSE =====
  addItem('R13-12 3/4" SIX WIRE MULTI SPIRAL HOSE', 'hose', 'meters', 2.10, { partNumber: 'R13-12', sae: 'R13', pressure: 350 });
  addItem('R13-16 1" SIX WIRE MULTI SPIRAL HOSE', 'hose', 'meters', 2.50, { partNumber: 'R13-16', sae: 'R13', pressure: 350 });

  // ===== NON-SKIVE FERRULES =====
  addItem('SN2-03 NON-SKIVE FERRULE FOR 1 BRAID HOSE', 'ferrule', 'pieces', 25, { partNumber: 'SN2-03', diameter: 0.1875 });
  addItem('SN2-04 NON-SKIVE FERRULE FOR 1&2 BRAID HOSE', 'ferrule', 'pieces', 25, { partNumber: 'SN2-04', diameter: 0.25 });
  addItem('SN2-05 NON-SKIVE FERRULE FOR 1&2 BRAID HOSE', 'ferrule', 'pieces', 30, { partNumber: 'SN2-05', diameter: 0.3125 });
  addItem('SN2-06 NON-SKIVE FERRULE FOR 1&2 BRAID HOSE', 'ferrule', 'pieces', 30, { partNumber: 'SN2-06', diameter: 0.375 });
  addItem('SN2-08 NON-SKIVE FERRULE FOR 1&2 BRAID HOSE', 'ferrule', 'pieces', 30, { partNumber: 'SN2-08', diameter: 0.5 });
  addItem('SN2-10 NON-SKIVE FERRULE FOR 1&2 BRAID HOSE', 'ferrule', 'pieces', 35, { partNumber: 'SN2-10', diameter: 0.625 });
  addItem('SN2-12 NON-SKIVE FERRULE FOR 1&2 BRAID HOSE', 'ferrule', 'pieces', 35, { partNumber: 'SN2-12', diameter: 0.75 });
  addItem('SN2-16 NON-SKIVE FERRULE FOR 1&2 BRAID HOSE', 'ferrule', 'pieces', 55, { partNumber: 'SN2-16', diameter: 1 });
  addItem('SN2-20 NON-SKIVE FERRULE FOR 1&2 BRAID HOSE', 'ferrule', 'pieces', 75, { partNumber: 'SN2-20', diameter: 1.25 });
  addItem('SN2-24 NON-SKIVE FERRULE FOR 1&2 BRAID HOSE', 'ferrule', 'pieces', 90, { partNumber: 'SN2-24', diameter: 1.5 });
  addItem('SN2-32 NON-SKIVE FERRULE FOR 1&2 BRAID HOSE', 'ferrule', 'pieces', 115, { partNumber: 'SN2-32', diameter: 2 });

  // ===== SKIVE FERRULES FOR 4SP/4SH =====
  addItem('F400-06 SKIVE FERRULE FOR MULTISPIRAL HOSE', 'ferrule', 'pieces', 35, { partNumber: 'F400-06', diameter: 0.375 });
  addItem('F400-08 SKIVE FERRULE FOR MULTISPIRAL HOSE', 'ferrule', 'pieces', 40, { partNumber: 'F400-08', diameter: 0.5 });
  addItem('F400-10 SKIVE FERRULE FOR MULTISPIRAL HOSE', 'ferrule', 'pieces', 45, { partNumber: 'F400-10', diameter: 0.625 });
  addItem('F400-12 SKIVE FERRULE FOR MULTISPIRAL HOSE', 'ferrule', 'pieces', 50, { partNumber: 'F400-12', diameter: 0.75 });
  addItem('F400-16 SKIVE FERRULE FOR MULTISPIRAL HOSE', 'ferrule', 'pieces', 65, { partNumber: 'F400-16', diameter: 1 });
  addItem('F400-20 SKIVE FERRULE FOR MULTISPIRAL HOSE', 'ferrule', 'pieces', 85, { partNumber: 'F400-20', diameter: 1.25 });
  addItem('F400-24 SKIVE FERRULE FOR MULTISPIRAL HOSE', 'ferrule', 'pieces', 100, { partNumber: 'F400-24', diameter: 1.5 });
  addItem('F400-32 SKIVE FERRULE FOR MULTISPIRAL HOSE', 'ferrule', 'pieces', 135, { partNumber: 'F400-32', diameter: 2 });

  // ===== INTERLOCK FERRULES =====
  addItem('F600-12 INTERLOCK FERRULE FOR R13 & R18 HOSES', 'ferrule', 'pieces', 55, { partNumber: 'F600-12', diameter: 0.75 });
  addItem('F600-16 INTERLOCK FERRULE FOR R13 & R18 HOSES', 'ferrule', 'pieces', 75, { partNumber: 'F600-16', diameter: 1 });
  addItem('F600-20 INTERLOCK FERRULE FOR R13 & R18 HOSES', 'ferrule', 'pieces', 95, { partNumber: 'F600-20', diameter: 1.25 });
  addItem('F600-24 INTERLOCK FERRULE FOR R13 & R18 HOSES', 'ferrule', 'pieces', 115, { partNumber: 'F600-24', diameter: 1.5 });
  addItem('F600-32 INTERLOCK FERRULE FOR R13 & R18 HOSES', 'ferrule', 'pieces', 155, { partNumber: 'F600-32', diameter: 2 });

  // ===== BSP STRAIGHT FEMALE =====
  addItem('BSP-04-04 BSP STRAIGHT FEMALE', 'fitting', 'pieces', 25, { partNumber: 'BSP-04-04', threadType: 'BSP', diameter: 0.25 });
  addItem('BSP-06-06 BSP STRAIGHT FEMALE', 'fitting', 'pieces', 30, { partNumber: 'BSP-06-06', threadType: 'BSP', diameter: 0.375 });
  addItem('BSP-08-08 BSP STRAIGHT FEMALE', 'fitting', 'pieces', 35, { partNumber: 'BSP-08-08', threadType: 'BSP', diameter: 0.5 });
  addItem('BSP-10-10 BSP STRAIGHT FEMALE', 'fitting', 'pieces', 45, { partNumber: 'BSP-10-10', threadType: 'BSP', diameter: 0.625 });
  addItem('BSP-12-12 BSP STRAIGHT FEMALE', 'fitting', 'pieces', 50, { partNumber: 'BSP-12-12', threadType: 'BSP', diameter: 0.75 });
  addItem('BSP-16-16 BSP STRAIGHT FEMALE', 'fitting', 'pieces', 75, { partNumber: 'BSP-16-16', threadType: 'BSP', diameter: 1 });
  addItem('BSP-20-20 BSP STRAIGHT FEMALE', 'fitting', 'pieces', 105, { partNumber: 'BSP-20-20', threadType: 'BSP', diameter: 1.25 });
  addItem('BSP-24-24 BSP STRAIGHT FEMALE', 'fitting', 'pieces', 145, { partNumber: 'BSP-24-24', threadType: 'BSP', diameter: 1.5 });
  addItem('BSP-32-32 BSP STRAIGHT FEMALE', 'fitting', 'pieces', 230, { partNumber: 'BSP-32-32', threadType: 'BSP', diameter: 2 });

  // ===== BSP 90° FITTINGS =====
  addItem('BSP-90°-04-04 BSP 90D SWEPT ELBOW', 'fitting', 'pieces', 30, { partNumber: 'BSP-90°-04-04', threadType: 'BSP', angle: 90 });
  addItem('BSP-90°-06-06 BSP 90D SWEPT ELBOW', 'fitting', 'pieces', 30, { partNumber: 'BSP-90°-06-06', threadType: 'BSP', angle: 90 });
  addItem('BSP-90°-08-08 BSP 90D SWEPT ELBOW', 'fitting', 'pieces', 40, { partNumber: 'BSP-90°-08-08', threadType: 'BSP', angle: 90 });
  addItem('BSP-90°-10-10 BSP 90D SWEPT ELBOW', 'fitting', 'pieces', 50, { partNumber: 'BSP-90°-10-10', threadType: 'BSP', angle: 90 });
  addItem('BSP-90°-12-12 BSP 90D SWEPT ELBOW', 'fitting', 'pieces', 70, { partNumber: 'BSP-90°-12-12', threadType: 'BSP', angle: 90 });
  addItem('BSP-90°-16-16 BSP 90D SWEPT ELBOW', 'fitting', 'pieces', 115, { partNumber: 'BSP-90°-16-16', threadType: 'BSP', angle: 90 });
  addItem('BSP-90°-20-20 BSP 90D SWEPT ELBOW', 'fitting', 'pieces', 140, { partNumber: 'BSP-90°-20-20', threadType: 'BSP', angle: 90 });
  addItem('BSP-90°-24-24 BSP 90D SWEPT ELBOW', 'fitting', 'pieces', 170, { partNumber: 'BSP-90°-24-24', threadType: 'BSP', angle: 90 });
  addItem('BSP-90°-32-32 BSP 90D SWEPT ELBOW', 'fitting', 'pieces', 320, { partNumber: 'BSP-90°-32-32', threadType: 'BSP', angle: 90 });

  // ===== BSP 45° FITTINGS =====
  addItem('BSP-45°-04-04 BSP 45D SWEPT ELBOW', 'fitting', 'pieces', 25, { partNumber: 'BSP-45°-04-04', threadType: 'BSP', angle: 45 });
  addItem('BSP-45°-06-06 BSP 45D SWEPT ELBOW', 'fitting', 'pieces', 30, { partNumber: 'BSP-45°-06-06', threadType: 'BSP', angle: 45 });
  addItem('BSP-45°-08-08 BSP 45D SWEPT ELBOW', 'fitting', 'pieces', 45, { partNumber: 'BSP-45°-08-08', threadType: 'BSP', angle: 45 });
  addItem('BSP-45°-10-10 BSP 45D SWEPT ELBOW', 'fitting', 'pieces', 50, { partNumber: 'BSP-45°-10-10', threadType: 'BSP', angle: 45 });
  addItem('BSP-45°-12-12 BSP 45D SWEPT ELBOW', 'fitting', 'pieces', 75, { partNumber: 'BSP-45°-12-12', threadType: 'BSP', angle: 45 });
  addItem('BSP-45°-16-16 BSP 45D SWEPT ELBOW', 'fitting', 'pieces', 120, { partNumber: 'BSP-45°-16-16', threadType: 'BSP', angle: 45 });
  addItem('BSP-45°-20-20 BSP 45D SWEPT ELBOW', 'fitting', 'pieces', 140, { partNumber: 'BSP-45°-20-20', threadType: 'BSP', angle: 45 });
  addItem('BSP-45°-24-24 BSP 45D SWEPT ELBOW', 'fitting', 'pieces', 205, { partNumber: 'BSP-45°-24-24', threadType: 'BSP', angle: 45 });
  addItem('BSP-45°-32-32 BSP 45D SWEPT ELBOW', 'fitting', 'pieces', 325, { partNumber: 'BSP-45°-32-32', threadType: 'BSP', angle: 45 });

  // ===== BSP MALE FITTINGS =====
  addItem('BSPM-04-04 BSP MALE', 'fitting', 'pieces', 25, { partNumber: 'BSPM-04-04', threadType: 'BSP' });
  addItem('BSPM-06-06 BSP MALE', 'fitting', 'pieces', 30, { partNumber: 'BSPM-06-06', threadType: 'BSP' });
  addItem('BSPM-08-08 BSP MALE', 'fitting', 'pieces', 35, { partNumber: 'BSPM-08-08', threadType: 'BSP' });
  addItem('BSPM-10-10 BSP MALE', 'fitting', 'pieces', 45, { partNumber: 'BSPM-10-10', threadType: 'BSP' });
  addItem('BSPM-12-12 BSP MALE', 'fitting', 'pieces', 50, { partNumber: 'BSPM-12-12', threadType: 'BSP' });
  addItem('BSPM-16-16 BSP MALE', 'fitting', 'pieces', 75, { partNumber: 'BSPM-16-16', threadType: 'BSP' });
  addItem('BSPM-20-20 BSP MALE', 'fitting', 'pieces', 115, { partNumber: 'BSPM-20-20', threadType: 'BSP' });
  addItem('BSPM-24-24 BSP MALE', 'fitting', 'pieces', 120, { partNumber: 'BSPM-24-24', threadType: 'BSP' });
  addItem('BSPM-32-32 BSP MALE', 'fitting', 'pieces', 235, { partNumber: 'BSPM-32-32', threadType: 'BSP' });

  // ===== NPT MALE FITTINGS =====
  addItem('NPT-02-04 NPT MALE', 'fitting', 'pieces', 25, { partNumber: 'NPT-02-04', threadType: 'NPT' });
  addItem('NPT-04-04 NPT MALE', 'fitting', 'pieces', 25, { partNumber: 'NPT-04-04', threadType: 'NPT' });
  addItem('NPT-06-06 NPT MALE', 'fitting', 'pieces', 30, { partNumber: 'NPT-06-06', threadType: 'NPT' });
  addItem('NPT-08-08 NPT MALE', 'fitting', 'pieces', 35, { partNumber: 'NPT-08-08', threadType: 'NPT' });
  addItem('NPT-10-10 NPT MALE', 'fitting', 'pieces', 40, { partNumber: 'NPT-10-10', threadType: 'NPT' });
  addItem('NPT-12-12 NPT MALE', 'fitting', 'pieces', 50, { partNumber: 'NPT-12-12', threadType: 'NPT' });
  addItem('NPT-16-16 NPT MALE', 'fitting', 'pieces', 75, { partNumber: 'NPT-16-16', threadType: 'NPT' });
  addItem('NPT-20-20 NPT MALE', 'fitting', 'pieces', 115, { partNumber: 'NPT-20-20', threadType: 'NPT' });
  addItem('NPT-24-24 NPT MALE', 'fitting', 'pieces', 135, { partNumber: 'NPT-24-24', threadType: 'NPT' });
  addItem('NPT-32-32 NPT MALE', 'fitting', 'pieces', 235, { partNumber: 'NPT-32-32', threadType: 'NPT' });
  addItem('NPTS-04-04 NPT SWIVEL MALE', 'fitting', 'pieces', 55, { partNumber: 'NPTS-04-04', threadType: 'NPT' });
  addItem('NPTS-12-12 NPT SWIVEL MALE', 'fitting', 'pieces', 85, { partNumber: 'NPTS-12-12', threadType: 'NPT' });

  // ===== JIC FITTINGS =====
  addItem('JIC-04-03 JIC STRAIGHT FEMALE 37D SEAT', 'fitting', 'pieces', 25, { partNumber: 'JIC-04-03', threadType: 'JIC' });
  addItem('JIC-04-04 JIC STRAIGHT FEMALE 37D SEAT', 'fitting', 'pieces', 25, { partNumber: 'JIC-04-04', threadType: 'JIC' });
  addItem('JIC-06-06 JIC STRAIGHT FEMALE 37D SEAT', 'fitting', 'pieces', 30, { partNumber: 'JIC-06-06', threadType: 'JIC' });
  addItem('JIC-08-08 JIC STRAIGHT FEMALE 37D SEAT', 'fitting', 'pieces', 35, { partNumber: 'JIC-08-08', threadType: 'JIC' });
  addItem('JIC-10-10 JIC STRAIGHT FEMALE 37D SEAT', 'fitting', 'pieces', 50, { partNumber: 'JIC-10-10', threadType: 'JIC' });
  addItem('JIC-12-12 JIC STRAIGHT FEMALE 37D SEAT', 'fitting', 'pieces', 55, { partNumber: 'JIC-12-12', threadType: 'JIC' });
  addItem('JIC-16-16 JIC STRAIGHT FEMALE 37D SEAT', 'fitting', 'pieces', 90, { partNumber: 'JIC-16-16', threadType: 'JIC' });
  addItem('JIC-20-20 JIC STRAIGHT FEMALE 37D SEAT', 'fitting', 'pieces', 115, { partNumber: 'JIC-20-20', threadType: 'JIC' });
  addItem('JIC-24-24 JIC STRAIGHT FEMALE 37D SEAT', 'fitting', 'pieces', 145, { partNumber: 'JIC-24-24', threadType: 'JIC' });
  addItem('JIC-32-32 JIC STRAIGHT FEMALE 37D SEAT', 'fitting', 'pieces', 275, { partNumber: 'JIC-32-32', threadType: 'JIC' });

  // ===== JIC 90° FITTINGS =====
  addItem('JIC-90°-04-04 JIC 90D SWEPT ELBOW 37D SEAT', 'fitting', 'pieces', 25, { partNumber: 'JIC-90°-04-04', threadType: 'JIC', angle: 90 });
  addItem('JIC-90°-06-06 JIC 90D SWEPT ELBOW 37D SEAT', 'fitting', 'pieces', 30, { partNumber: 'JIC-90°-06-06', threadType: 'JIC', angle: 90 });
  addItem('JIC-90°-08-08 JIC 90D SWEPT ELBOW 37D SEAT', 'fitting', 'pieces', 40, { partNumber: 'JIC-90°-08-08', threadType: 'JIC', angle: 90 });
  addItem('JIC-90°-10-10 JIC 90D SWEPT ELBOW 37D SEAT', 'fitting', 'pieces', 55, { partNumber: 'JIC-90°-10-10', threadType: 'JIC', angle: 90 });
  addItem('JIC-90°-12-12 JIC 90D SWEPT ELBOW 37D SEAT', 'fitting', 'pieces', 70, { partNumber: 'JIC-90°-12-12', threadType: 'JIC', angle: 90 });
  addItem('JIC-90°-16-16 JIC 90D SWEPT ELBOW 37D SEAT', 'fitting', 'pieces', 105, { partNumber: 'JIC-90°-16-16', threadType: 'JIC', angle: 90 });
  addItem('JIC-90°-20-20 JIC 90D SWEPT ELBOW 37D SEAT', 'fitting', 'pieces', 130, { partNumber: 'JIC-90°-20-20', threadType: 'JIC', angle: 90 });
  addItem('JIC-90°-24-24 JIC 90D SWEPT ELBOW 37D SEAT', 'fitting', 'pieces', 150, { partNumber: 'JIC-90°-24-24', threadType: 'JIC', angle: 90 });
  addItem('JIC-90°-32-32 JIC 90D SWEPT ELBOW 37D SEAT', 'fitting', 'pieces', 280, { partNumber: 'JIC-90°-32-32', threadType: 'JIC', angle: 90 });

  // ===== JIC 45° FITTINGS =====
  addItem('JIC-45°-04-04 JIC 45D SWEPT ELBOW 37D SEAT', 'fitting', 'pieces', 30, { partNumber: 'JIC-45°-04-04', threadType: 'JIC', angle: 45 });
  addItem('JIC-45°-06-06 JIC 45D SWEPT ELBOW 37D SEAT', 'fitting', 'pieces', 30, { partNumber: 'JIC-45°-06-06', threadType: 'JIC', angle: 45 });
  addItem('JIC-45°-08-08 JIC 45D SWEPT ELBOW 37D SEAT', 'fitting', 'pieces', 40, { partNumber: 'JIC-45°-08-08', threadType: 'JIC', angle: 45 });
  addItem('JIC-45°-10-10 JIC 45D SWEPT ELBOW 37D SEAT', 'fitting', 'pieces', 60, { partNumber: 'JIC-45°-10-10', threadType: 'JIC', angle: 45 });
  addItem('JIC-45°-12-12 JIC 45D SWEPT ELBOW 37D SEAT', 'fitting', 'pieces', 70, { partNumber: 'JIC-45°-12-12', threadType: 'JIC', angle: 45 });
  addItem('JIC-45°-16-16 JIC 45D SWEPT ELBOW 37D SEAT', 'fitting', 'pieces', 105, { partNumber: 'JIC-45°-16-16', threadType: 'JIC', angle: 45 });
  addItem('JIC-45°-20-20 JIC 45D SWEPT ELBOW 37D SEAT', 'fitting', 'pieces', 135, { partNumber: 'JIC-45°-20-20', threadType: 'JIC', angle: 45 });
  addItem('JIC-45°-24-24 JIC 45D SWEPT ELBOW 37D SEAT', 'fitting', 'pieces', 165, { partNumber: 'JIC-45°-24-24', threadType: 'JIC', angle: 45 });
  addItem('JIC-45°-32-32 JIC 45D SWEPT ELBOW 37D SEAT', 'fitting', 'pieces', 280, { partNumber: 'JIC-45°-32-32', threadType: 'JIC', angle: 45 });

  // ===== JIC MALE FITTINGS =====
  addItem('JICM-04-04 JIC 37D FLARE MALE', 'fitting', 'pieces', 25, { partNumber: 'JICM-04-04', threadType: 'JIC' });
  addItem('JICM-06-06 JIC 37D FLARE MALE', 'fitting', 'pieces', 30, { partNumber: 'JICM-06-06', threadType: 'JIC' });
  addItem('JICM-08-08 JIC 37D FLARE MALE', 'fitting', 'pieces', 35, { partNumber: 'JICM-08-08', threadType: 'JIC' });
  addItem('JICM-10-10 JIC 37D FLARE MALE', 'fitting', 'pieces', 40, { partNumber: 'JICM-10-10', threadType: 'JIC' });
  addItem('JICM-12-12 JIC 37D FLARE MALE', 'fitting', 'pieces', 45, { partNumber: 'JICM-12-12', threadType: 'JIC' });
  addItem('JICM-16-16 JIC 37D FLARE MALE', 'fitting', 'pieces', 70, { partNumber: 'JICM-16-16', threadType: 'JIC' });
  addItem('JICM-20-20 JIC 37D FLARE MALE', 'fitting', 'pieces', 95, { partNumber: 'JICM-20-20', threadType: 'JIC' });
  addItem('JICM-24-24 JIC 37D FLARE MALE', 'fitting', 'pieces', 115, { partNumber: 'JICM-24-24', threadType: 'JIC' });
  addItem('JICM-32-32 JIC 37D FLARE MALE', 'fitting', 'pieces', 225, { partNumber: 'JICM-32-32', threadType: 'JIC' });

  // ===== ORFS FITTINGS =====
  addItem('ORFS-04-04 ORS FEMALE SWIVEL STRAIGHT', 'fitting', 'pieces', 25, { partNumber: 'ORFS-04-04', threadType: 'ORFS' });
  addItem('ORFS-06-06 ORS FEMALE SWIVEL STRAIGHT', 'fitting', 'pieces', 30, { partNumber: 'ORFS-06-06', threadType: 'ORFS' });
  addItem('ORFS-08-08 ORS FEMALE SWIVEL STRAIGHT', 'fitting', 'pieces', 35, { partNumber: 'ORFS-08-08', threadType: 'ORFS' });
  addItem('ORFS-10-10 ORS FEMALE SWIVEL STRAIGHT', 'fitting', 'pieces', 40, { partNumber: 'ORFS-10-10', threadType: 'ORFS' });
  addItem('ORFS-12-12 ORS FEMALE SWIVEL STRAIGHT', 'fitting', 'pieces', 55, { partNumber: 'ORFS-12-12', threadType: 'ORFS' });
  addItem('ORFS-16-16 ORS FEMALE SWIVEL STRAIGHT', 'fitting', 'pieces', 80, { partNumber: 'ORFS-16-16', threadType: 'ORFS' });
  addItem('ORFS-20-20 ORS FEMALE SWIVEL STRAIGHT', 'fitting', 'pieces', 115, { partNumber: 'ORFS-20-20', threadType: 'ORFS' });
  addItem('ORFS-24-24 ORS FEMALE SWIVEL STRAIGHT', 'fitting', 'pieces', 140, { partNumber: 'ORFS-24-24', threadType: 'ORFS' });

  // ===== ORFS 90° FITTINGS =====
  addItem('ORFS-90°-04-04 ORS FEMALE SWIVEL 90D ELBOW', 'fitting', 'pieces', 25, { partNumber: 'ORFS-90°-04-04', threadType: 'ORFS', angle: 90 });
  addItem('ORFS-90°-06-06 ORS FEMALE SWIVEL 90D ELBOW', 'fitting', 'pieces', 30, { partNumber: 'ORFS-90°-06-06', threadType: 'ORFS', angle: 90 });
  addItem('ORFS-90°-08-08 ORS FEMALE SWIVEL 90D ELBOW', 'fitting', 'pieces', 35, { partNumber: 'ORFS-90°-08-08', threadType: 'ORFS', angle: 90 });
  addItem('ORFS-90°-10-10 ORS FEMALE SWIVEL 90D ELBOW', 'fitting', 'pieces', 45, { partNumber: 'ORFS-90°-10-10', threadType: 'ORFS', angle: 90 });
  addItem('ORFS-90°-12-12 ORS FEMALE SWIVEL 90D ELBOW', 'fitting', 'pieces', 65, { partNumber: 'ORFS-90°-12-12', threadType: 'ORFS', angle: 90 });
  addItem('ORFS-90°-16-16 ORS FEMALE SWIVEL 90D ELBOW', 'fitting', 'pieces', 125, { partNumber: 'ORFS-90°-16-16', threadType: 'ORFS', angle: 90 });
  addItem('ORFS-90°-20-20 ORS FEMALE SWIVEL 90D ELBOW', 'fitting', 'pieces', 135, { partNumber: 'ORFS-90°-20-20', threadType: 'ORFS', angle: 90 });
  addItem('ORFS-90°-24-24 ORS FEMALE SWIVEL 90D ELBOW', 'fitting', 'pieces', 140, { partNumber: 'ORFS-90°-24-24', threadType: 'ORFS', angle: 90 });

  // ===== ORFS 90° FEMALE ELBOW FLAT SEAT =====
  addItem('ORFS-90°-04-04 L 90° ORF FEMALE ELBOW FLAT SEAT 2"', 'fitting', 'pieces', 50, { partNumber: 'ORFS-90°-04-04L', threadType: 'ORFS', angle: 90 });
  addItem('ORFS-90°-06-06 L 90° ORF FEMALE ELBOW FLAT SEAT 4"', 'fitting', 'pieces', 55, { partNumber: 'ORFS-90°-06-06L', threadType: 'ORFS', angle: 90 });
  addItem('ORFS-90°-08-08 L 90° ORF FEMALE ELBOW FLAT SEAT 4"', 'fitting', 'pieces', 60, { partNumber: 'ORFS-90°-08-08L', threadType: 'ORFS', angle: 90 });
  addItem('ORFS-90°-12-12 L 90° ORF FEMALE ELBOW FLAT SEAT 4"', 'fitting', 'pieces', 90, { partNumber: 'ORFS-90°-12-12L', threadType: 'ORFS', angle: 90 });
  addItem('ORFS-90°-16-16 L 90° ORF FEMALE ELBOW FLAT SEAT 4"', 'fitting', 'pieces', 145, { partNumber: 'ORFS-90°-16-16L', threadType: 'ORFS', angle: 90 });

  // ===== ORFS 45° FEMALE ELBOW FLAT SEAT =====
  addItem('ORFS-45°-04-04 45° ORF FEMALE ELBOW FLAT SEAT', 'fitting', 'pieces', 25, { partNumber: 'ORFS-45°-04-04', threadType: 'ORFS', angle: 45 });
  addItem('ORFS-45°-06-06 45° ORF FEMALE ELBOW FLAT SEAT', 'fitting', 'pieces', 30, { partNumber: 'ORFS-45°-06-06', threadType: 'ORFS', angle: 45 });
  addItem('ORFS-45°-08-08 45° ORF FEMALE ELBOW FLAT SEAT', 'fitting', 'pieces', 35, { partNumber: 'ORFS-45°-08-08', threadType: 'ORFS', angle: 45 });
  addItem('ORFS-45°-10-10 45° ORF FEMALE ELBOW FLAT SEAT', 'fitting', 'pieces', 60, { partNumber: 'ORFS-45°-10-10', threadType: 'ORFS', angle: 45 });
  addItem('ORFS-45°-12-12 45° ORF FEMALE ELBOW FLAT SEAT', 'fitting', 'pieces', 70, { partNumber: 'ORFS-45°-12-12', threadType: 'ORFS', angle: 45 });
  addItem('ORFS-45°-16-16 45° ORF FEMALE ELBOW FLAT SEAT', 'fitting', 'pieces', 115, { partNumber: 'ORFS-45°-16-16', threadType: 'ORFS', angle: 45 });
  addItem('ORFS-45°-20-20 45° ORF FEMALE ELBOW FLAT SEAT', 'fitting', 'pieces', 135, { partNumber: 'ORFS-45°-20-20', threadType: 'ORFS', angle: 45 });

  // ===== ORF MALE O-RING SEAT =====
  addItem('ORFM-04-04 ORF MALE O-RING SEAT', 'fitting', 'pieces', 30, { partNumber: 'ORFM-04-04', threadType: 'ORFS' });
  addItem('ORFM-06-06 ORF MALE O-RING SEAT', 'fitting', 'pieces', 35, { partNumber: 'ORFM-06-06', threadType: 'ORFS' });
  addItem('ORFM-08-08 ORF MALE O-RING SEAT', 'fitting', 'pieces', 40, { partNumber: 'ORFM-08-08', threadType: 'ORFS' });
  addItem('ORFM-10-10 ORF MALE O-RING SEAT', 'fitting', 'pieces', 45, { partNumber: 'ORFM-10-10', threadType: 'ORFS' });
  addItem('ORFM-12-12 ORF MALE O-RING SEAT', 'fitting', 'pieces', 55, { partNumber: 'ORFM-12-12', threadType: 'ORFS' });
  addItem('ORFM-16-16 ORF MALE O-RING SEAT', 'fitting', 'pieces', 80, { partNumber: 'ORFM-16-16', threadType: 'ORFS' });
  addItem('ORFM-20-20 ORF MALE O-RING SEAT', 'fitting', 'pieces', 115, { partNumber: 'ORFM-20-20', threadType: 'ORFS' });

  // ===== SAE FLANGE 3000 PSI CODE 61 =====
  addItem('FL3-08-08 SAE FLANGE STRAIGHT 3000 PSI CODE 61', 'fitting', 'pieces', 55, { partNumber: 'FL3-08-08', threadType: 'SAE', pressure: 3000 });
  addItem('FL3-10-10 SAE FLANGE STRAIGHT 3000 PSI CODE 61', 'fitting', 'pieces', 75, { partNumber: 'FL3-10-10', threadType: 'SAE', pressure: 3000 });
  addItem('FL3-12-12 SAE FLANGE STRAIGHT 3000 PSI CODE 61', 'fitting', 'pieces', 85, { partNumber: 'FL3-12-12', threadType: 'SAE', pressure: 3000 });
  addItem('FL3-16-16 SAE FLANGE STRAIGHT 3000 PSI CODE 61', 'fitting', 'pieces', 115, { partNumber: 'FL3-16-16', threadType: 'SAE', pressure: 3000 });
  addItem('FL3-20-20 SAE FLANGE STRAIGHT 3000 PSI CODE 61', 'fitting', 'pieces', 130, { partNumber: 'FL3-20-20', threadType: 'SAE', pressure: 3000 });
  addItem('FL3-24-24 SAE FLANGE STRAIGHT 3000 PSI CODE 61', 'fitting', 'pieces', 190, { partNumber: 'FL3-24-24', threadType: 'SAE', pressure: 3000 });
  addItem('FL3-32-32 SAE FLANGE STRAIGHT 3000 PSI CODE 61', 'fitting', 'pieces', 230, { partNumber: 'FL3-32-32', threadType: 'SAE', pressure: 3000 });

  // ===== METRIC FEMALE LIGHT DUTY =====
  addItem('MLF-06-03 METRIC FEMALE LIGHT DUTY', 'fitting', 'pieces', 20, { partNumber: 'MLF-06-03', threadType: 'Metric' });
  addItem('MLF-06-04 METRIC FEMALE LIGHT DUTY', 'fitting', 'pieces', 20, { partNumber: 'MLF-06-04', threadType: 'Metric' });
  addItem('MLF-08-04 METRIC FEMALE LIGHT DUTY', 'fitting', 'pieces', 20, { partNumber: 'MLF-08-04', threadType: 'Metric' });
  addItem('MLF-10-04 METRIC FEMALE LIGHT DUTY', 'fitting', 'pieces', 25, { partNumber: 'MLF-10-04', threadType: 'Metric' });
  addItem('MLF-10-06 METRIC FEMALE LIGHT DUTY', 'fitting', 'pieces', 25, { partNumber: 'MLF-10-06', threadType: 'Metric' });
  addItem('MLF-12-06 METRIC FEMALE LIGHT DUTY', 'fitting', 'pieces', 30, { partNumber: 'MLF-12-06', threadType: 'Metric' });
  addItem('MLF-18-06 METRIC FEMALE LIGHT DUTY', 'fitting', 'pieces', 30, { partNumber: 'MLF-18-06', threadType: 'Metric' });
  addItem('MLF-18-08 METRIC FEMALE LIGHT DUTY', 'fitting', 'pieces', 30, { partNumber: 'MLF-18-08', threadType: 'Metric' });
  addItem('MLF-18-10 METRIC FEMALE LIGHT DUTY', 'fitting', 'pieces', 45, { partNumber: 'MLF-18-10', threadType: 'Metric' });
  addItem('MLF-22-10 METRIC FEMALE LIGHT DUTY', 'fitting', 'pieces', 45, { partNumber: 'MLF-22-10', threadType: 'Metric' });
  addItem('MLF-22-12 METRIC FEMALE LIGHT DUTY', 'fitting', 'pieces', 50, { partNumber: 'MLF-22-12', threadType: 'Metric' });
  addItem('MLF-28-16 METRIC FEMALE LIGHT DUTY', 'fitting', 'pieces', 100, { partNumber: 'MLF-28-16', threadType: 'Metric' });

  // ===== METRIC MALE LIGHT DUTY =====
  addItem('MLM-06-03 METRIC MALE 24D SEAT L/DUTY', 'fitting', 'pieces', 20, { partNumber: 'MLM-06-03', threadType: 'Metric' });
  addItem('MLM-06-04 METRIC MALE 24D SEAT L/DUTY', 'fitting', 'pieces', 20, { partNumber: 'MLM-06-04', threadType: 'Metric' });
  addItem('MLM-08-04 METRIC MALE 24D SEAT L/DUTY', 'fitting', 'pieces', 22, { partNumber: 'MLM-08-04', threadType: 'Metric' });
  addItem('MLM-10-06 METRIC MALE 24D SEAT L/DUTY', 'fitting', 'pieces', 25, { partNumber: 'MLM-10-06', threadType: 'Metric' });
  addItem('MLM-12-06 METRIC MALE 24D SEAT L/DUTY', 'fitting', 'pieces', 25, { partNumber: 'MLM-12-06', threadType: 'Metric' });
  addItem('MLM-18-06 METRIC MALE 24D SEAT L/DUTY', 'fitting', 'pieces', 30, { partNumber: 'MLM-18-06', threadType: 'Metric' });
  addItem('MLM-18-08 METRIC MALE 24D SEAT L/DUTY', 'fitting', 'pieces', 30, { partNumber: 'MLM-18-08', threadType: 'Metric' });
  addItem('MLM-18-10 METRIC MALE 24D SEAT L/DUTY', 'fitting', 'pieces', 35, { partNumber: 'MLM-18-10', threadType: 'Metric' });
  addItem('MLM-22-12 METRIC MALE 24D SEAT L/DUTY', 'fitting', 'pieces', 35, { partNumber: 'MLM-22-12', threadType: 'Metric' });
  addItem('MLM-28-16 METRIC MALE 24D SEAT L/DUTY', 'fitting', 'pieces', 70, { partNumber: 'MLM-28-16', threadType: 'Metric' });

  // ===== METRIC FEMALE HEAVY DUTY =====
  addItem('MHF-08-04 O-RING STRAIGHT FEMALE HEAVY DUTY', 'fitting', 'pieces', 20, { partNumber: 'MHF-08-04', threadType: 'Metric' });
  addItem('MHF-10-04 O-RING STRAIGHT FEMALE HEAVY DUTY', 'fitting', 'pieces', 22, { partNumber: 'MHF-10-04', threadType: 'Metric' });
  addItem('MHF-12-04 O-RING STRAIGHT FEMALE HEAVY DUTY', 'fitting', 'pieces', 25, { partNumber: 'MHF-12-04', threadType: 'Metric' });
  addItem('MHF-10-06 O-RING STRAIGHT FEMALE HEAVY DUTY', 'fitting', 'pieces', 25, { partNumber: 'MHF-10-06', threadType: 'Metric' });
  addItem('MHF-12-06 O-RING STRAIGHT FEMALE HEAVY DUTY', 'fitting', 'pieces', 25, { partNumber: 'MHF-12-06', threadType: 'Metric' });
  addItem('MHF-14-06 O-RING STRAIGHT FEMALE HEAVY DUTY', 'fitting', 'pieces', 25, { partNumber: 'MHF-14-06', threadType: 'Metric' });
  addItem('MHF-14-08 O-RING STRAIGHT FEMALE HEAVY DUTY', 'fitting', 'pieces', 30, { partNumber: 'MHF-14-08', threadType: 'Metric' });
  addItem('MHF-16-08 O-RING STRAIGHT FEMALE HEAVY DUTY', 'fitting', 'pieces', 35, { partNumber: 'MHF-16-08', threadType: 'Metric' });
  addItem('MHF-20-10 O-RING STRAIGHT FEMALE HEAVY DUTY', 'fitting', 'pieces', 55, { partNumber: 'MHF-20-10', threadType: 'Metric' });
  addItem('MHF-20-12 O-RING STRAIGHT FEMALE HEAVY DUTY', 'fitting', 'pieces', 60, { partNumber: 'MHF-20-12', threadType: 'Metric' });
  addItem('MHF-25-12 O-RING STRAIGHT FEMALE HEAVY DUTY', 'fitting', 'pieces', 90, { partNumber: 'MHF-25-12', threadType: 'Metric' });
  addItem('MHF-30-16 O-RING STRAIGHT FEMALE HEAVY DUTY', 'fitting', 'pieces', 110, { partNumber: 'MHF-30-16', threadType: 'Metric' });
  addItem('MHF-38-20 O-RING STRAIGHT FEMALE HEAVY DUTY', 'fitting', 'pieces', 220, { partNumber: 'MHF-38-20', threadType: 'Metric' });

  // ===== KOMATSU FITTINGS =====
  addItem('KOMATSU-12-04 METRIC FEMALE STRAIGHT KOMATSU 60° CONE SEAT', 'fitting', 'pieces', 20, { partNumber: 'KOMATSU-12-04', threadType: 'Komatsu' });
  addItem('KOMATSU-14-04 METRIC FEMALE STRAIGHT KOMATSU 60° CONE SEAT', 'fitting', 'pieces', 20, { partNumber: 'KOMATSU-14-04', threadType: 'Komatsu' });
  addItem('KOMATSU-16-06 METRIC FEMALE STRAIGHT KOMATSU 60° CONE SEAT', 'fitting', 'pieces', 25, { partNumber: 'KOMATSU-16-06', threadType: 'Komatsu' });
  addItem('KOMATSU-18-06 METRIC FEMALE STRAIGHT KOMATSU 60° CONE SEAT', 'fitting', 'pieces', 30, { partNumber: 'KOMATSU-18-06', threadType: 'Komatsu' });
  addItem('KOMATSU-20-06 METRIC FEMALE STRAIGHT KOMATSU 60° CONE SEAT', 'fitting', 'pieces', 30, { partNumber: 'KOMATSU-20-06', threadType: 'Komatsu' });
  addItem('KOMATSU-20-08 METRIC FEMALE STRAIGHT KOMATSU 60° CONE SEAT', 'fitting', 'pieces', 35, { partNumber: 'KOMATSU-20-08', threadType: 'Komatsu' });
  addItem('KOMATSU-22-08 METRIC FEMALE STRAIGHT KOMATSU 60° CONE SEAT', 'fitting', 'pieces', 35, { partNumber: 'KOMATSU-22-08', threadType: 'Komatsu' });
  addItem('KOMATSU-30-12 METRIC FEMALE STRAIGHT KOMATSU 60° CONE SEAT', 'fitting', 'pieces', 50, { partNumber: 'KOMATSU-30-12', threadType: 'Komatsu' });

  // ===== KOMATSU 90° ELBOWS =====
  addItem('KOMATSU-90-12-04 METRIC FEMALE STRAIGHT KOMATSU 60° CONE SEAT ELBOW', 'fitting', 'pieces', 22, { partNumber: 'KOMATSU-90-12-04', threadType: 'Komatsu', angle: 90 });
  addItem('KOMATSU-90-14-04 METRIC FEMALE STRAIGHT KOMATSU 60° CONE SEAT ELBOW', 'fitting', 'pieces', 22, { partNumber: 'KOMATSU-90-14-04', threadType: 'Komatsu', angle: 90 });
  addItem('KOMATSU-90-16-06 METRIC FEMALE STRAIGHT KOMATSU 60° CONE SEAT ELBOW', 'fitting', 'pieces', 30, { partNumber: 'KOMATSU-90-16-06', threadType: 'Komatsu', angle: 90 });
  addItem('KOMATSU-90-18-06 METRIC FEMALE STRAIGHT KOMATSU 60° CONE SEAT ELBOW', 'fitting', 'pieces', 30, { partNumber: 'KOMATSU-90-18-06', threadType: 'Komatsu', angle: 90 });
  addItem('KOMATSU-90-20-08 METRIC FEMALE STRAIGHT KOMATSU 60° CONE SEAT ELBOW', 'fitting', 'pieces', 35, { partNumber: 'KOMATSU-90-20-08', threadType: 'Komatsu', angle: 90 });
  addItem('KOMATSU-90-22-08 METRIC FEMALE STRAIGHT KOMATSU 60° CONE SEAT ELBOW', 'fitting', 'pieces', 40, { partNumber: 'KOMATSU-90-22-08', threadType: 'Komatsu', angle: 90 });
  addItem('KOMATSU-90-30-12 METRIC FEMALE STRAIGHT KOMATSU 60° CONE SEAT ELBOW', 'fitting', 'pieces', 70, { partNumber: 'KOMATSU-90-30-12', threadType: 'Komatsu', angle: 90 });

  // ===== ADAPTERS =====
  addItem('ADBB-04-04 BSP MALE X BSP MALE ADAPTOR', 'adapter', 'pieces', 15, { partNumber: 'ADBB-04-04', threadType: 'BSP' });
  addItem('ADBB-06-06 BSP MALE X BSP MALE ADAPTOR', 'adapter', 'pieces', 18, { partNumber: 'ADBB-06-06', threadType: 'BSP' });
  addItem('ADBB-08-08 BSP MALE X BSP MALE ADAPTOR', 'adapter', 'pieces', 22, { partNumber: 'ADBB-08-08', threadType: 'BSP' });
  addItem('ADBB-12-12 BSP MALE X BSP MALE ADAPTOR', 'adapter', 'pieces', 28, { partNumber: 'ADBB-12-12', threadType: 'BSP' });
  addItem('ADBB-16-16 BSP MALE X BSP MALE ADAPTOR', 'adapter', 'pieces', 40, { partNumber: 'ADBB-16-16', threadType: 'BSP' });

  addItem('ADGG-04-04 JIC MALE X JIC MALE ADAPTOR', 'adapter', 'pieces', 15, { partNumber: 'ADGG-04-04', threadType: 'JIC' });
  addItem('ADGG-06-06 JIC MALE X JIC MALE ADAPTOR', 'adapter', 'pieces', 18, { partNumber: 'ADGG-06-06', threadType: 'JIC' });
  addItem('ADGG-08-08 JIC MALE X JIC MALE ADAPTOR', 'adapter', 'pieces', 22, { partNumber: 'ADGG-08-08', threadType: 'JIC' });
  addItem('ADGG-12-12 JIC MALE X JIC MALE ADAPTOR', 'adapter', 'pieces', 28, { partNumber: 'ADGG-12-12', threadType: 'JIC' });
  addItem('ADGG-16-16 JIC MALE X JIC MALE ADAPTOR', 'adapter', 'pieces', 40, { partNumber: 'ADGG-16-16', threadType: 'JIC' });

  // ===== QUICK RELEASE COUPLINGS =====
  addItem('QRC-04 (1/4") QUICK RELEASE COUPLING', 'coupling', 'pieces', 45, { partNumber: 'QRC-04', diameter: 0.25 });
  addItem('QRC-06 (3/8") QUICK RELEASE COUPLING', 'coupling', 'pieces', 55, { partNumber: 'QRC-06', diameter: 0.375 });
  addItem('QRC-08 (1/2") QUICK RELEASE COUPLING', 'coupling', 'pieces', 65, { partNumber: 'QRC-08', diameter: 0.5 });
  addItem('QRC-12 (3/4") QUICK RELEASE COUPLING', 'coupling', 'pieces', 85, { partNumber: 'QRC-12', diameter: 0.75 });
  addItem('QRC-16 (1") QUICK RELEASE COUPLING', 'coupling', 'pieces', 110, { partNumber: 'QRC-16', diameter: 1 });

  // ===== HOSE JOINERS (LIFE SAVER) =====
  addItem('96X96-04-04 HOSE JOINER', 'other', 'pieces', 35, { partNumber: '96X96-04-04' });
  addItem('96X96-06-06 HOSE JOINER', 'other', 'pieces', 40, { partNumber: '96X96-06-06' });
  addItem('96X96-08-08 HOSE JOINER', 'other', 'pieces', 45, { partNumber: '96X96-08-08' });
  addItem('96X96-10-10 HOSE JOINER', 'other', 'pieces', 55, { partNumber: '96X96-10-10' });
  addItem('96X96-12-12 HOSE JOINER', 'other', 'pieces', 65, { partNumber: '96X96-12-12' });
  addItem('96X96-16-16 HOSE JOINER', 'other', 'pieces', 85, { partNumber: '96X96-16-16' });
  addItem('96X96-20-20 HOSE JOINER', 'other', 'pieces', 110, { partNumber: '96X96-20-20' });
  addItem('96X96-24-24 HOSE JOINER', 'other', 'pieces', 135, { partNumber: '96X96-24-24' });
  addItem('96X96-32-32 HOSE JOINER', 'other', 'pieces', 180, { partNumber: '96X96-32-32' });

  return items;
};

// ===== USERS =====
export const initialUsers: IUser[] = [
  {
    id: 'u1', name: 'Admin User', email: 'admin@hydraulic.com', role: Roles.ADMIN, password: 'admin123', last_login: new Date(),
    first_name: 'Admin',
    last_name: 'User',
    phone: '+233 30 123 4567',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'u2', name: 'John Sales', email: 'john@hydraulic.com', role: Roles.SALES, password: 'sales123', last_login: new Date(),
    first_name: 'John',
    last_name: 'Sales',
    phone: '+233 30 222 3333',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'u3', name: 'Mike Tech', email: 'mike@hydraulic.com', role: Roles.TECHNICIAN, password: 'tech123', last_login: new Date(),
    first_name: 'Mike',
    last_name: 'Tech',
    phone: '+233 30 333 4444',
    created_at: new Date(),
    updated_at: new Date()
  },
  {
    id: 'u4', name: 'Sarah Viewer', email: 'sarah@hydraulic.com', role: Roles.VIEWER, password: 'viewer123', last_login: new Date(),
    first_name: 'Sarah',
    last_name: 'Viewer',
    phone: '+233 30 444 5555',
    created_at: new Date(),
    updated_at: new Date()
  },
];

// ===== SYSTEM SETTINGS =====
export const defaultSystemSettings: SystemSettings = {
  companyName: 'MIVA-CRIMP JV',
  companyAddress: '123 Industrial Road, Accra, Ghana',
  companyPhone: '+233 30 222 3333',
  companyEmail: 'info@mivacrimp.com',
  taxRate: 12.5,
  nhilRate: 2.5,
  getfundRate: 2.5,
  covidLevyRate: 1.0,
  currency: 'GHS',
  invoicePrefix: 'INV-',
  quotePrefix: 'QUOTE-',
  defaultPaymentTerms: 'Net 30',
  enableOfflineMode: true,
  autoBackup: true,
  backupFrequency: 'daily',
};

// ===== SAMPLE INVOICES =====
export const generateSampleInvoices = (): Invoice[] => {
  const invoices: Invoice[] = [];
  const customers = ['Ghana Mining Corp', 'Accra Construction Ltd', 'Tema Port Authority', 'Walk-in Customer'];
  const statuses: ('draft' | 'quoted' | 'invoiced' | 'cancelled')[] = ['draft', 'quoted', 'invoiced', 'invoiced', 'invoiced'];
  const paymentStatuses: ('Paid' | 'Partial' | 'Unpaid')[] = ['Paid', 'Paid', 'Paid', 'Unpaid', 'Partial'];
  const paymentMethods: ('Cash' | 'MoMo' | 'Bank' | 'Credit')[] = ['Cash', 'MoMo', 'Bank', 'Credit'];
  
  for (let i = 1; i <= 25; i++) {
    const itemCount = Math.floor(Math.random() * 4) + 1;
    const items: InvoiceItem[] = [];
    let subtotal = 0;
    
    for (let j = 0; j < itemCount; j++) {
      const price = Math.floor(Math.random() * 100) + 10;
      const quantity = Math.floor(Math.random() * 5) + 1;
      const total = price * quantity;
      items.push({
        id: `item-${i}-${j}`,
        description: `Hydraulic Component ${String.fromCharCode(65 + j)}`,
        quantity,
        unitPrice: price,
        total,
      });
      subtotal += total;
    }
    
    const vat = subtotal * 0.125;
    const nhil = subtotal * 0.025;
    const getfund = subtotal * 0.025;
    const covidLevy = subtotal * 0.01;
    const total = subtotal + vat + nhil + getfund + covidLevy;
    
    // Random date in 2024
    const month = Math.floor(Math.random() * 12);
    const day = Math.floor(Math.random() * 28) + 1;
    
    const status = statuses[Math.floor(Math.random() * statuses.length)];
    const paymentStatus = paymentStatuses[Math.floor(Math.random() * paymentStatuses.length)];
    
    invoices.push({
      id: `inv-${String(i).padStart(4, '0')}`,
      number: `INV-${String(i).padStart(4, '0')}`,
      date: new Date(2024, month, day),
      dueDate: new Date(2024, month, day + 30),
      customer: customers[Math.floor(Math.random() * customers.length)],
      customerEmail: `customer${i}@example.com`,
      customerPhone: `+233 50 ${String(Math.floor(Math.random() * 1000000)).padStart(6, '0')}`,
      items,
      subtotal,
      discountTotal: 0,
      vat,
      nhil,
      getfund,
      covidLevy,
      total: Math.round(total * 100) / 100,
      paymentMethod: paymentMethods[Math.floor(Math.random() * paymentMethods.length)],
      paymentStatus: status === 'invoiced' ? paymentStatus : 'Unpaid',
      amountPaid: paymentStatus === 'Paid' ? Math.round(total * 100) / 100 : 
                  paymentStatus === 'Partial' ? Math.round((total * 0.5) * 100) / 100 : 0,
      status: status,
      notes: i % 3 === 0 ? 'Please deliver to site' : undefined,
      terms: 'Net 30'
    });
  }
  return invoices;
};