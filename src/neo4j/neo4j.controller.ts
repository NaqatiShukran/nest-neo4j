import { Body, Controller, Get, Param, Post } from '@nestjs/common';
import { createNodeObject } from 'src/dto/create-node.dto';
import { createRelationObject } from 'src/dto/create-relation.dto';
import { Neo4jService } from './neo4j.service';

@Controller('neo4j')
export class Neo4jController {

    constructor(private readonly neo4jService: Neo4jService) {}

    @Get('count')
    async getCount(){
        try{
            const res = await this.neo4jService.read('MATCH (n) RETURN count(n) AS count');
            return(`There are ${res.records[0].get('count')} records in DB`);
        } catch (err) {
            return { error: err.message}
        }
    }

    // @Post('newNode')
    // async createNode(@Body('name') name: string){
    //     try{
    //         return this.neo4jService.write('CREATE (p:Person {name: $name}) RETURN p', {name});
    //     } catch (err) {
    //         return { error: err.message}
    //     }
    // }

    @Post('newNode')
    async properties(@Body() input: createNodeObject){
        try{
            return this.neo4jService.write(`CREATE (node: ${input.label}) SET node += $properties RETURN node`, {properties: input.properties});
        } catch (err) {
            return { error: err.message}
        }
    }

    @Post('newRel')
    async createRelationship(@Body() input: createRelationObject){
        try{
            return this.neo4jService.createRelations(input);
        } catch (err) {
                return { error: err.message}
        }
    }

    @Post('updateProperty')
    async updateProperty(){
        try{
            return this.neo4jService.write(`match (per:Person {name: $name})
            set per.age = $age`, {name: "Shukran", age: 26});
        } catch (err) {
            return { error: err.message}
        }
    }

    @Get('getOne/user/:name')
    async getOneUser(@Param('name') name: string){
        try{
            const rec = await this.neo4jService.read(`MATCH (user: User) WHERE user.name= $name
            RETURN user`, {name});
            return rec.records[0].get('user');
        } catch (err) {
            return { error: err.message}
        }
    }

    @Get('getOne/review/:review')
    async getOneReview(@Param('review') review: string){
        try{
            const rec = await this.neo4jService.read(`MATCH (rev: Review) WHERE rev.review= $review
            RETURN rev`, {review});
            return rec.records[0].get('rev');
        } catch (err) {
            return { error: err.message}
        }
    }

    @Get('getUserRel/:name')
    async getRel(@Param('name') name: string){
    try{
        return this.neo4jService.getRelation(name);
    } catch (err) {
            return { error: err.message}
        }
    }
}