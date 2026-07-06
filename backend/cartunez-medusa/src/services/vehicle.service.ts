import { Service } from "medusa-extender";
import { TransactionBaseService } from "@medusajs/medusa";
import { EntityManager } from "typeorm";
import { ProductVehicleCompatibility, VehicleVariant } from "../models/vehicle";

@Service()
export class VehicleCompatibilityService extends TransactionBaseService {
  protected manager_: EntityManager;
  protected readonly container: Record<string, any>;

  async getProductCompatibility(productId: string): Promise<any> {
    return await this.atomicPhase_(async (manager) => {
      const repo = manager.getRepository(ProductVehicleCompatibility);
      return repo.find({
        where: { product_id: productId },
        relations: ["vehicle_variant", "vehicle_variant.year", "vehicle_variant.year.model", "vehicle_variant.year.model.make"],
      });
    });
  }

  async setProductCompatibility(
    productId: string,
    data: {
      variant_ids: string[];
      fitment_type?: string;
      notes?: string;
    }
  ): Promise<any> {
    return await this.atomicPhase_(async (manager) => {
      const repo = manager.getRepository(ProductVehicleCompatibility);

      await repo.delete({ product_id: productId });

      const entries = data.variant_ids.map((variantId) =>
        repo.create({
          product_id: productId,
          vehicle_variant_id: variantId,
          fitment_type: data.fitment_type || "exact",
          notes: data.notes,
        })
      );

      return repo.save(entries);
    });
  }

  async getProductsForVariant(variantId: string): Promise<any> {
    return await this.atomicPhase_(async (manager) => {
      const repo = manager.getRepository(ProductVehicleCompatibility);
      return repo.find({
        where: { vehicle_variant_id: variantId },
      });
    });
  }

  async getProductsForYear(yearId: string): Promise<any[]> {
    return await this.atomicPhase_(async (manager) => {
      const variantRepo = manager.getRepository(VehicleVariant);
      const variants = await variantRepo.find({ where: { year_id: yearId } });
      if (variants.length === 0) return [];

      const variantIds = variants.map((v) => v.id);
      const compatRepo = manager.getRepository(ProductVehicleCompatibility);

      const results = await compatRepo
        .createQueryBuilder("pvc")
        .where("pvc.vehicle_variant_id IN (:...variantIds)", { variantIds })
        .select(["pvc.product_id", "pvc.vehicle_variant_id", "pvc.fitment_type"])
        .getMany();

      return results;
    });
  }
}

export default VehicleCompatibilityService;
