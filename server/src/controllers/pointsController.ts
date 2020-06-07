import {Request, Response} from 'express';
import knex from '../database/connection';

class PointsController{
    async index(request: Request, response: Response){
        const { city, uf, items } = request.query;

        const parsedItems = String(items)
        .split(',')
        .map(item => Number(item.trim()));

        const points = await knex('points')
            .join('point_items', 'points.id', '=', 'point_items.point_id')
            .whereIn('point_items.items_id', parsedItems)
            .where('city', String(city))
            .where('uf', String(uf))
            .distinct() //nao retornar dois points iguais 
            .select('points.*');

        const serializedPoints = points.map(point => {
            return {
                ...point,
                image_url: `http://192.168.8.2:3333/uploads/${point.image}`,
            };
        });

       return response.json(serializedPoints);
    }

    async show(request: Request, response: Response){
        const { id } = request.params;

        const trx = await knex.transaction();
        
        const point = await trx('points').where('id', id).first();
    
        if(!point){
            return response.status(400).json({message: 'Point not found'});
        }

        const serializedPoint = {
            ...point,
            image_url: `http://192.168.8.2:3333/uploads/${point.image}`,
        };
    
        const items = await trx('items')
        .join('point_items', 'items.id', '=', 'point_items.items_id')
        .where('point_items.point_id', id)
        .select('items.title');
        
        trx.commit();
        
        return response.json({point: serializedPoint, items});  
    }

    async create(request: Request, response: Response){
        const {
            name, 
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf,
            items
        }  = request.body;
    
        const trx = await knex.transaction(); //se alguma query(INSERT) falhou, a outra também falha
        
        const point = {
            image: request.file.filename,
            name, 
            email,
            whatsapp,
            latitude,
            longitude,
            city,
            uf
        };

        const insertedIds = await trx('points').insert(point);
    
        const point_id = insertedIds[0];
        
        const pointItems = 
        items.split(',')
        .map((item: string)=> Number(item.trim()))
        .map((items_id: number) => {
            return{
                items_id,
                point_id,
            };
        });
        
        await trx('point_items').insert(pointItems);
        
        trx.commit();
        
        return response.json({
            id: point_id,
            ...point,
        });
    }
}

export default PointsController;